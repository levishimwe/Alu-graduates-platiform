const cloudinary = require("../config/cloudinary");

exports.uploadFile = async (filePath, folder = "alu-platform", resourceType = "auto") => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: resourceType,
  });
  return result;
};

exports.deleteFile = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

exports.uploadAvatar = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "alu-platform/avatars",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });
  return result;
};

exports.uploadDegree = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "alu-platform/degrees",
    resource_type: "raw",
  });
  return result;
};