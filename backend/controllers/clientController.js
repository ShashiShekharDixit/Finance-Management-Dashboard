const Client = require('../models/Client');

exports.getClients = async (req, res) => {
  try {
    const { type, search, page=1, limit=50 } = req.query;
    const q = { user: req.user._id };
    if (type) q.type = type;
    if (search) q.$or = [{ name:{$regex:search,$options:'i'} },{ email:{$regex:search,$options:'i'} }];
    const [clients, total] = await Promise.all([
      Client.find(q).sort({ createdAt:-1 }).skip((page-1)*limit).limit(Number(limit)),
      Client.countDocuments(q)
    ]);
    res.json({ clients, total });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, user: req.user._id });
    res.status(201).json({ client });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id:req.params.id, user:req.user._id });
    if (!client) return res.status(404).json({ message:'Not found' });
    res.json({ client });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate({ _id:req.params.id, user:req.user._id }, req.body, { new:true });
    if (!client) return res.status(404).json({ message:'Not found' });
    res.json({ client });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id:req.params.id, user:req.user._id });
    if (!client) return res.status(404).json({ message:'Not found' });
    res.json({ message:'Deleted' });
  } catch(err) { res.status(500).json({ message:err.message }); }
};
