import env from "../config/env";
import { User } from "../modules/user/user.model";
import bcrypt from "bcryptjs";

export const createAdmin = async () => {
  const exists = await User.findOne({ email: env.ADMIN_EMAIL });

  if (!exists) {
    const hash = await bcrypt.hash(env.ADMIN_PASS!, 10);


    await User.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: hash,
      isVerified: true,
      role: "admin",
    });
    console.log("Admin created successfully!");
  }
};
