const jwt = require('jsonwebtoken');
const User = require('../models/User');
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
const pick = (u) => ({ _id:u._id, name:u.name, email:u.email, businessName:u.businessName, gstin:u.gstin, phone:u.phone, address:u.address, role:u.role });

exports.register = async (req, res) => {
  try {
    const { name, email, password, businessName, gstin, phone } = req.body;
    if (!name||!email||!password) return res.status(400).json({ message:'Name, email and password required' });
    if (await User.findOne({ email })) return res.status(400).json({ message:'Email already registered' });
    const user = await User.create({ name, email, password, businessName, gstin, phone });
    res.status(201).json({ token: genToken(user._id), user: pick(user) });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) return res.status(400).json({ message:'Email and password required' });
    const user = await User.findOne({ email });
    if (!user||!(await user.matchPassword(password))) return res.status(401).json({ message:'Invalid credentials' });
    res.json({ token: genToken(user._id), user: pick(user) });
  } catch(err) { res.status(500).json({ message:err.message }); }
};

exports.getMe = async (req, res) => res.json({ user: pick(req.user) });

exports.updateProfile = async (req, res) => {
  try {
    const fields = ['name','businessName','gstin','phone','address'];
    const update = {};
    fields.forEach(f => { if (req.body[f]!==undefined) update[f]=req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, update, { new:true }).select('-password');
    res.json({ user: pick(user) });
  } catch(err) { res.status(500).json({ message:err.message }); }
};
