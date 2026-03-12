const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");
const { requireRole } = require("../middleware/role");

const FILE  = path.join(__dirname, "../data/users.json");
const read  = () => JSON.parse(fs.readFileSync(FILE, "utf-8"));
const write = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));

const safe = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || "", lat: u.lat, lng: u.lng, createdAt: u.createdAt });

/* GET /api/users — admin only, list all users */
router.get("/", requireRole("admin"), (req, res) => {
  const users = read().map(safe);
  res.json(users);
});

/* GET /api/users/stats — admin only */
router.get("/stats", requireRole("admin"), (req, res) => {
  const users = read();
  res.json({
    total:   users.length,
    admins:  users.filter(u => u.role === "admin").length,
    workers: users.filter(u => u.role === "worker").length,
    users:   users.filter(u => u.role === "user").length,
  });
});

/* DELETE /api/users/:id — admin only */
router.delete("/:id", requireRole("admin"), (req, res) => {
  const id       = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  const users    = read();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return res.status(404).json({ error: "User not found" });
  write(filtered);
  res.json({ message: "User deleted" });
});

module.exports = router;
