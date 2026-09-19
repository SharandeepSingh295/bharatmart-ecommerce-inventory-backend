const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const config = require('../config/env');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../utils/apiError');

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  register(userData) {
    const { name, email, password, phone, role = 'CUSTOMER', address } = userData;

    // 1. Check if email already registered
    const existing = userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(`User with email '${email}' is already registered`);
    }

    // 2. Hash password
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    // 3. Create unique user
    const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newUser = {
      id,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: role.toUpperCase(),
      address: address || 'Connaught Place, New Delhi, Delhi 110001',
      createdAt: now
    };

    userRepository.create(newUser);

    const token = this.generateToken(newUser);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        address: newUser.address,
        createdAt: newUser.createdAt
      },
      token
    };
  }

  login(email, password) {
    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        createdAt: user.createdAt
      },
      token
    };
  }

  getProfile(userId) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const { password, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();
