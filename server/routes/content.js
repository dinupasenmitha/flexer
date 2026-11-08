const express = require('express');
const { db } = require('../db');
const { requireAdmin } = require('../auth');
const router = express.Router();
router.get('/', (req,res) => {
  const kind = req.query.kind;
  if (!['faq','review'].includes(kind)) return res.status(400).json({error:'Choose FAQ or review'});
  res.json(db.prepare('SELECT id,kind,title,body,product_name,rating,created_at FROM content_entries WHERE kind = ? AND published = 1 ORDER BY id DESC').all(kind));
});
router.get('/admin', requireAdmin, (_req,res) => res.json(db.prepare('SELECT * FROM content_entries ORDER BY id DESC').all()));
function save(req,res) {
  const {kind,title,body,product_name='',rating=5,published=false}=req.body;
  if(!['faq','review'].includes(kind) || typeof title!=='string' || !title.trim() || title.length>200 || typeof body!=='string' || !body.trim() || body.length>8000 || typeof product_name!=='string' || product_name.length>200 || !Number.isInteger(Number(rating)) || Number(rating)<1 || Number(rating)>5) return res.status(400).json({error:'Provide a title, text and a rating between 1 and 5'});
  const now=new Date().toISOString();
  if(req.params.id) {
    const result=db.prepare('UPDATE content_entries SET kind=?,title=?,body=?,product_name=?,rating=?,published=?,updated_at=? WHERE id=?').run(kind,title.trim(),body.trim(),product_name,Number(rating),published?1:0,now,Number(req.params.id));
    if(!result.changes)return res.status(404).json({error:'Entry not found'});
  } else db.prepare('INSERT INTO content_entries(kind,title,body,product_name,rating,published,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(kind,title.trim(),body.trim(),product_name,Number(rating),published?1:0,now,now);
  res.json({success:true});
}
router.post('/',requireAdmin,save);
router.put('/:id',requireAdmin,save);
module.exports=router;
