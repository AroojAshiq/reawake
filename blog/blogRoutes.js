import { getBlogById, getAllBlog, deleteBlogById } from "./blogController.js";
import express from "express";

const blogRouter = express.Router();

blogRouter.get("/get-blog-by-id/:id", getBlogById);
blogRouter.delete("/delete-blog-by-id/:id", deleteBlogById);
blogRouter.get("/get-all-blog", getAllBlog);

export default blogRouter;
