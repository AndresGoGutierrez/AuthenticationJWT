import User from "../models/User";
import jwt from "jsonwebtoken";
import config from "../config";
import Role from "../models/Role";

export const signUp = async (req, res) => {
  const { username, email, password, roles } = req.body;

  const userFound = User.find({ email });

  const newUser = new User({
    username,
    email,
    password: await User.encryptPassword(password),
  });

  if (roles) {
    const foundRoles = await Role.find({ name: { $in: roles } });
    newUser.roles = foundRoles.map((role) => role._id);
  } else {
    const role = await Role.findOne({ name: "user" });
    newUser.roles = [role._id];
  }

  const savedUser = await newUser.save();

  console.log(savedUser);

  const token = jwt.sign({ id: savedUser._id }, config.SECRET, {
    expiresIn: 86400, // 24 hours
  });

  res.status(200).json({ token });
};

export const signIn = async (req, res) => {
  const userFound = await User.findOne({ email: req.body.email }).populate(
    "roles"
  );

  if (!userFound) return res.status(400).json({ message: "User not found" });

  const matchPassword = await User.comparePassword(
    req.body.password,
    userFound.password
  );

  if (!matchPassword)
    return res.status(401).json({ token: null, message: "Invalid password" });

  const token = jwt.sign({ id: userFound._id }, config.SECRET, {
    expiresIn: 86400,
  });

  res.json({ token });
};

export const verifyToken = async (req, res) => {
  try {
    // 1) Try to read token from body
    let token = req.body.token;
    // 2) If not in body, check x-access-token header
    if (!token && req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    }
    // 3) Otherwise, check Authorization: Bearer <token>
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(403).json({ message: "No token provided", isValid: false });
    }

    // Verify token
    const decoded = jwt.verify(token, config.SECRET);

    // Find user
    const user = await User.findById(decoded.id).populate("roles");
    if (!user) {
      return res.status(404).json({ message: "User not found", isValid: false });
    }

    const roles = user.roles.map(role => role.name);
    return res.status(200).json({
      isValid: true,
      id: user._id,
      username: user.username,
      email: user.email,
      roles
    });

  } catch (error) {
    return res.status(401).json({ message: "Unauthorized", isValid: false });
  }
};
