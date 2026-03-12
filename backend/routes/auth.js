const express    = require("express");
const router     = express.Router();
const fs         = require("fs");
const path       = require("path");
const jwt        = require("jsonwebtoken");
const { SECRET, verifyToken } = require("../middleware/auth");

const USERS_FILE   = path.join(__dirname, "../data/users.json");
const WORKERS_FILE = path.join(__dirname, "../data/workers.json");

const readUsers   = () => JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
const writeUsers  = (d) => fs.writeFileSync(USERS_FILE, JSON.stringify(d, null, 2));
const readWorkers = () => JSON.parse(fs.readFileSync(WORKERS_FILE, "utf-8"));
const writeWorkers= (d) => fs.writeFileSync(WORKERS_FILE, JSON.stringify(d, null, 2));

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    SECRET, { expiresIn: "7d" }
  );
}

function safeUser(u, workerId = null) {
  const base = { id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || "", lat: u.lat || 0, lng: u.lng || 0, pincode: u.pincode || "", street: u.street || "" };
  if (workerId) base.workerId = workerId;
  return base;
}

/* POST /api/auth/login - requires role field for role-specific login */
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });
  if (!role || !["user", "worker", "admin"].includes(role))
    return res.status(400).json({ error: "A valid role must be specified" });

  const users = readUsers();
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  if (user.role !== role) {
    return res.status(403).json({
      error: `This account is registered as '${user.role}'. Please use the '${user.role}' login instead.`
    });
  }

  let workerId = null;
  if (user.role === "worker") {
    const workers = readWorkers();
    const wp = workers.find(w => w.userId === user.id);
    if (wp) workerId = wp.id;
  }

  const token = makeToken(user);
  res.json({ token, user: safeUser(user, workerId) });
});

/* POST /api/auth/signup - admin signup is BLOCKED */
router.post("/signup", (req, res) => {
  const { name, email, password, role = "user", phone, categoryId, bio, lat, lng, pincode, street } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required" });

  if (role === "admin")
    return res.status(403).json({ error: "Admin accounts cannot be created via signup. Contact a system administrator." });

  if (!["user", "worker"].includes(role))
    return res.status(400).json({ error: "Role must be user or worker" });

  if (!email.toLowerCase().endsWith("@gmail.com"))
    return res.status(400).json({ error: "Only Gmail accounts (@gmail.com) are accepted" });

  const users = readUsers();
  if (users.find(u => u.email === email))
    return res.status(409).json({ error: "This email is already registered" });

  const newUser = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role,
    avatar: "",
    lat: parseFloat(lat) || 40.7128,
    lng: parseFloat(lng) || -74.006,
    pincode: pincode || "",
    street:  street  || "",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);

  let workerId = null;
  if (role === "worker") {
    if (!phone || !categoryId)
      return res.status(400).json({ error: "Workers need phone and category" });

    const workers = readWorkers();
    const newWorker = {
      id: Date.now() + 1,
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      categoryId: parseInt(categoryId),
      phone: phone.trim(),
      bio: bio || "",
      specialization: "",
      lat: newUser.lat, lng: newUser.lng,
      pincode: newUser.pincode,
      street:  newUser.street,
      availability: true,
      approved: false,
      avatar: "",
      rating: 0, jobsCompleted: 0,
    };
    workers.push(newWorker);
    writeWorkers(workers);
    workerId = newWorker.id;
  }

  const token = makeToken(newUser);
  res.status(201).json({ token, user: safeUser(newUser, workerId) });
});

/* GET /api/auth/me */
router.get("/me", verifyToken, (req, res) => {
  const users = readUsers();
  const user  = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  let workerId = null;
  if (user.role === "worker") {
    const wp = readWorkers().find(w => w.userId === user.id);
    if (wp) workerId = wp.id;
  }
  res.json(safeUser(user, workerId));
});

/* PUT /api/auth/profile */
router.put("/profile", verifyToken, (req, res) => {
  const users = readUsers();
  const idx   = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  const { name, email, password, avatar, lat, lng, pincode, street } = req.body;

  if (email && email !== users[idx].email) {
    if (users.find(u => u.email === email && u.id !== req.user.id))
      return res.status(409).json({ error: "Email already in use" });
  }

  if (name)              users[idx].name   = name.trim();
  if (email)             users[idx].email  = email.trim();
  if (password?.trim())  users[idx].password = password.trim();
  if (avatar !== undefined) users[idx].avatar = avatar;
  if (lat)               users[idx].lat    = parseFloat(lat);
  if (lng)               users[idx].lng    = parseFloat(lng);
  if (pincode !== undefined) users[idx].pincode = pincode;
  if (street  !== undefined) users[idx].street  = street;

  writeUsers(users);

  if (users[idx].role === "worker") {
    const workers = readWorkers();
    const wi = workers.findIndex(w => w.userId === req.user.id);
    if (wi !== -1) {
      if (name)  workers[wi].name   = users[idx].name;
      if (email) workers[wi].email  = users[idx].email;
      if (avatar !== undefined) workers[wi].avatar = avatar;
      if (lat)   workers[wi].lat    = parseFloat(lat);
      if (lng)   workers[wi].lng    = parseFloat(lng);
      writeWorkers(workers);
    }
  }

  const token = makeToken(users[idx]);
  let workerId = null;
  if (users[idx].role === "worker") {
    const wp = readWorkers().find(w => w.userId === req.user.id);
    if (wp) workerId = wp.id;
  }
  res.json({ token, user: safeUser(users[idx], workerId) });
});

module.exports = router;
