import Blog from "./blogModel.js";

const getAllBlog = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 6;
  const skip = (page - 1) * perPage;
  const searchQuery = req.query.search || "";
  try {
    let query = {};
    if (req.query.search) {
      query.title = { $regex: searchQuery, $options: "i" };
    }
    if (req.query.page === 0 && perPage === 6) {
      const blog = await Blog.find().sort({ title: 1 });
      res.status(200).json({
        success: true,
        message: "Blogs",
        blog,
      });
    } else {
      const blog = await Blog.find(query).sort({ title: 1 });
      const paginatedPosts = blog.slice(skip, skip + perPage);
      const totalPages = Math.ceil(blog.length / perPage);
      res.status(200).json({
        success: true,
        message: "Blogs",
        blog,
        totalPages,
        paginatedPosts,
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const blog = await Blog.findById(id);
      if (blog) {
        res.status(200).json({
          success: true,
          message: "Blog Details",
          blog,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Blog not found",
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Blog id not found",
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const deleteBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const blog = await Blog.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Blog Deleted successfully",
        blog,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Blog id not found",
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export { getAllBlog, getBlogById, deleteBlogById };
