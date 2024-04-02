import bcrypt from "bcryptjs";

const Users = [
  {
    firstName: "admin",
    lastName: "admin",
    email: "admin@gmail.com",
    password: bcrypt.hashSync("987654321", 10),
    role: "Admin",
  },
  {
    firstName: "admin",
    lastName: "admin",
    email: "admin2@gmail.com",
    password: bcrypt.hashSync("987654321", 10),
    role: "Admin",
  },
  {
    firstName: "admin",
    lastName: "admin",
    email: "admin3@gmail.com",
    password: bcrypt.hashSync("987654321", 10),
    role: "Admin",
  },
];

export default Users;
