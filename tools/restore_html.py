# -*- coding: utf-8 -*-
import glob, re

files = [
    'public/404.html',
    'public/checkout.html',
    'public/product.html',
    'public/shop.html',
    'public/pages/about.html',
    'public/pages/contact.html',
    'public/pages/privacy.html',
    'public/pages/returns.html',
    'public/pages/shipping.html',
    'public/pages/terms.html',
    'public/pages/warranty.html',
]

for fp in files:
    with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # 1. First restore &rarr; to space
    content = content.replace('&rarr;', ' ')

    # 2. Restore &#10022; to 'o'
    content = content.replace('&#10022;', 'o')

    # 3. Now restore true announcement dots and arrow links
    content = content.replace('<span class="announcement-dot">o</span>', '<span class="announcement-dot">&#10022;</span>')
    content = content.replace('<span> </span></a>', '<span>&rarr;</span></a>')
    content = content.replace('<span> </span>', '<span>&rarr;</span>')

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Fixed: {fp}")

print("All restored cleanly.")
