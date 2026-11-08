<?php
/**
 * ============================================================
 * FLEXER EYEWEAR — PHP 8.2 Production API Bridge
 * Enables 100% native execution on Hostinger Apache/PHP with SQLite
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = __DIR__ . '/../data/flexer.db';
if (!file_exists(dirname($dbPath))) {
    mkdir(dirname($dbPath), 0755, true);
}

try {
    $pdo = new PDO("sqlite:" . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Request path parsing
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = preg_replace('#^/api/#', '', $uri);
$uri = trim($uri, '/');
$parts = explode('/', $uri);
$method = $_SERVER['REQUEST_METHOD'];

// Helper to get JSON payload
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Helper to verify admin token
function checkAdmin($pdo) {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (strpos($auth, 'Bearer ') === 0) {
        $token = substr($auth, 7);
        $parts = explode('.', $token);
        if (count($parts) === 3) {
            $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
            if ($payload && isset($payload['username']) && $payload['exp'] > time()) {
                return $payload;
            }
        }
    }
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ROUTE: /api/health
if ($parts[0] === 'health') {
    echo json_encode(['status' => 'healthy', 'brand' => 'FLEXER', 'platform' => 'PHP/8.2']);
    exit;
}

// ROUTE: /api/products
if ($parts[0] === 'products') {
    if ($method === 'GET' && !isset($parts[1])) {
        $cat = $_GET['category'] ?? null;
        $type = $_GET['product_type'] ?? null;
        $search = $_GET['search'] ?? null;
        $sort = $_GET['sort'] ?? 'featured';

        $sql = "SELECT * FROM products WHERE active = 1";
        $params = [];
        if ($cat) { $sql .= " AND category = ?"; $params[] = strtolower($cat); }
        if ($type) { $sql .= " AND product_type = ?"; $params[] = strtolower($type); }
        if ($search) {
            $sql .= " AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)";
            $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%";
        }

        switch ($sort) {
            case 'price-asc': $sql .= " ORDER BY price ASC"; break;
            case 'price-desc': $sql .= " ORDER BY price DESC"; break;
            case 'name': $sql .= " ORDER BY name ASC"; break;
            case 'newest': $sql .= " ORDER BY created_at DESC"; break;
            default: $sql .= " ORDER BY featured DESC, id ASC"; break;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        foreach ($products as &$p) {
            $p['images'] = json_decode($p['images'] ?? '[]', true);
            $p['inclusions'] = json_decode($p['inclusions'] ?? '[]', true);
            $vStmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id = ?");
            $vStmt->execute([$p['id']]);
            $p['variants'] = $vStmt->fetchAll();
            $p['colors'] = array_column($p['variants'], 'color_hex');
        }
        echo json_encode($products);
        exit;
    }

    if ($method === 'GET' && isset($parts[1])) {
        $slugOrId = $parts[1];
        if (is_numeric($slugOrId)) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$slugOrId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE slug = ?");
            $stmt->execute([$slugOrId]);
        }
        $p = $stmt->fetch();
        if (!$p) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            exit;
        }
        $p['images'] = json_decode($p['images'] ?? '[]', true);
        $p['inclusions'] = json_decode($p['inclusions'] ?? '[]', true);
        $vStmt = $pdo->prepare("SELECT * FROM product_variants WHERE product_id = ?");
        $vStmt->execute([$p['id']]);
        $p['variants'] = $vStmt->fetchAll();
        $p['colors'] = array_column($p['variants'], 'color_hex');
        echo json_encode($p);
        exit;
    }
}

// ROUTE: /api/orders
if ($parts[0] === 'orders') {
    if ($method === 'POST') {
        $name = trim($input['customer_name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $wa = trim($input['whatsapp_number'] ?? $phone);
        $address = trim($input['address'] ?? '');
        $city = trim($input['city'] ?? '');
        $district = trim($input['district'] ?? '');
        $payMethod = $input['payment_method'] ?? 'bank_transfer';
        $items = $input['items'] ?? [];

        if (!$name || !$phone || !$address || !$city || !$district) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required customer delivery information']);
            exit;
        }

        // Authoritative server-side pricing
        $subtotal = 0;
        $validatedItems = [];
        foreach ($items as $item) {
            $pid = (int)($item['id'] ?? 0);
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND active = 1");
            $stmt->execute([$pid]);
            $prod = $stmt->fetch();
            if (!$prod) {
                http_response_code(400);
                echo json_encode(['error' => "Product ID $pid not found"]);
                exit;
            }
            $qty = max(1, min(20, (int)($item['quantity'] ?? $item['qty'] ?? 1)));
            $uPrice = (int)$prod['price'];
            $iTotal = $uPrice * $qty;
            $subtotal += $iTotal;
            $validatedItems[] = [
                'product_id' => $prod['id'],
                'product_sku' => $prod['sku'],
                'product_name' => $prod['name'],
                'unit_price' => $uPrice,
                'quantity' => $qty,
                'item_total' => $iTotal,
                'color_name' => $item['color_name'] ?? 'Standard',
                'color_hex' => $item['color_hex'] ?? '#000000',
                'image_snapshot' => $prod['primary_image']
            ];
        }

        $orderRef = 'FLX-2026-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        $now = date('Y-m-d H:i:s');
        $initPayStatus = $payMethod === 'cod' ? 'due_on_delivery' : ($payMethod === 'koko' ? 'koko_pending' : 'awaiting_transfer');

        $pdo->beginTransaction();
        try {
            $oStmt = $pdo->prepare("
                INSERT INTO orders (
                    order_ref, customer_name, phone, whatsapp_number, email,
                    address, city, district, postal_code, notes,
                    payment_method, payment_status, order_status,
                    subtotal, delivery_fee, total_payable, whatsapp_opened, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, 0, ?, 0, ?, ?)
            ");
            $oStmt->execute([
                $orderRef, $name, $phone, $wa, $input['email'] ?? null,
                $address, $city, $district, $input['postal_code'] ?? null, $input['notes'] ?? null,
                $payMethod, $initPayStatus, $subtotal, $subtotal, $now, $now
            ]);
            $orderId = $pdo->lastInsertId();

            $iStmt = $pdo->prepare("
                INSERT INTO order_items (
                    order_id, product_id, product_sku, product_name,
                    color_name, color_hex, unit_price, quantity, item_total, image_snapshot
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($validatedItems as $vi) {
                $iStmt->execute([
                    $orderId, $vi['product_id'], $vi['product_sku'], $vi['product_name'],
                    $vi['color_name'], $vi['color_hex'], $vi['unit_price'], $vi['quantity'], $vi['item_total'], $vi['image_snapshot']
                ]);
            }
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Order creation failed']);
            exit;
        }

        // Return bank details if bank transfer
        $bankDetails = null;
        if ($payMethod === 'bank_transfer') {
            $getSetting = function($k) use ($pdo) {
                $s = $pdo->prepare("SELECT value FROM settings WHERE key = ?");
                $s->execute([$k]);
                return $s->fetchColumn() ?: '';
            };
            $bankDetails = [
                'bank_name' => $getSetting('bank_name'),
                'branch_name' => $getSetting('bank_branch'),
                'account_holder' => $getSetting('bank_account_holder'),
                'account_number' => $getSetting('bank_account_number'),
                'instructions' => $getSetting('bank_payment_instructions')
            ];
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'order_ref' => $orderRef,
            'payment_method' => $payMethod,
            'payment_status' => $initPayStatus,
            'subtotal' => $subtotal,
            'total_payable' => $subtotal,
            'customer' => ['name' => $name, 'phone' => $phone, 'address' => "$address, $city, $district"],
            'items' => $validatedItems,
            'bank_details' => $bankDetails
        ]);
        exit;
    }

    if ($method === 'GET') {
        checkAdmin($pdo);
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY id DESC LIMIT 100");
        $orders = $stmt->fetchAll();
        $itemStmt = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
        foreach ($orders as &$o) {
            $itemStmt->execute([$o['id']]);
            $o['items'] = $itemStmt->fetchAll();
        }
        echo json_encode($orders);
        exit;
    }
}

// ROUTE: /api/settings
if ($parts[0] === 'settings') {
    if ($method === 'GET') {
        $rows = $pdo->query("SELECT key, value FROM settings")->fetchAll();
        $res = [];
        foreach ($rows as $r) { $res[$r['key']] = $r['value']; }
        echo json_encode($res);
        exit;
    }
}

// ROUTE: /api/auth/login
if ($parts[0] === 'auth' && ($parts[1] ?? '') === 'login') {
    $u = trim($input['username'] ?? '');
    $p = $input['password'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$u]);
    $user = $stmt->fetch();
    if ($user) {
        $hash = hash_pbkdf2("sha512", $p, $user['salt'], 100000, 64);
        if ($hash === $user['password_hash']) {
            $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode(['username' => $u, 'exp' => time() + 86400 * 7]));
            $sig = hash_hmac('sha256', "$header.$payload", 'flexer-luxury-secret-key-2026-sri-lanka-secure-token');
            echo json_encode(['success' => true, 'token' => "$header.$payload.$sig", 'username' => $u]);
            exit;
        }
    }
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
