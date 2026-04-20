import { Hono } from "hono";

const wpsRouter = new Hono();

wpsRouter.get("/files/:fileId", async (c) => {
  const fileId = c.req.param("fileId");

  return c.json({
    code: 0,
    data: {
      id: fileId,
      name: "test.docx",
      version: 1,
      size: 1123,
      creator_id: "system",
      modifier_id: "system",
      create_time: Date.now(),
      modify_time: Date.now(),
    },
  });
});

wpsRouter.get("/files/:fileId/download", async (c) => {
  return c.json({
    code: 0,
    data: {
      download_url:
        "https://doc-review.tos-cn-beijing.volces.com/%E9%99%84%E4%BB%B65-%E3%80%90%E5%8B%9F%E4%B9%A6%E3%80%91%E6%88%90%E9%83%BD%E9%AB%98%E6%8A%95%E4%BA%A7%E5%9F%8E%E5%BB%BA%E8%AE%BE%E9%9B%86%E5%9B%A2%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B82025%E5%B9%B4%E9%9D%A2%E5%90%91%E4%B8%93%E4%B8%9A%E6%8A%95%E8%B5%84%E8%80%85%E9%9D%9E%E5%85%AC%E5%BC%80%E5%8F%91%E8%A1%8C%E5%85%AC%E5%8F%B8%E5%80%BA%E5%88%B8%E5%8B%9F%E9%9B%86%E8%AF%B4%E6%98%8E%E4%B9%A60216%EF%BC%88%E6%B8%85%E6%B4%81%E7%89%88%EF%BC%89-1776500687598.docx",
    },
  });
});

wpsRouter.get("/files/:fileId/permission", async (c) => {
  return c.json({
    code: 0,
    data: {
      read: 1,
      download: 1,
      copy: 0,
      rename: 0,
      history: 0,
      comment: 0,
      print: 0,
      update: 0,
    },
  });
});

export default wpsRouter;
