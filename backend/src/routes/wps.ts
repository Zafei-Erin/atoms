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
      url: "https://doc-review.tos-cn-beijing.volces.com/%E9%99%84%E4%BB%B63-%E4%B8%AD%E5%9B%BD%E5%B9%B3%E5%AE%89%E9%87%91%E8%A3%95%E4%BA%BA%E7%94%9F%E7%90%86%E8%B4%A2%E4%BA%A7%E5%93%81-f1689605-cfd0-4246-bd86-375a38526fce-1776655921492.docx?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=AKTP23R3oKR4PnicVxMBiuxewzA2rRJSNsQ77nLr67RTsW1%2F20260420%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260420T153647Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Security-Token=nChBvMlNIdFphUGtMcUtHWld2.CiQKEHVNU1JGYmN4M1BjUm9iVlMSEGzaxI5jAkjylcF414qeS4EQs42ZzwYYw6mZzwYgqvvC6wcoATCq-8LrBzoEcm9vdEIDdG9zUhcwNDg45omL5py655So5oi3I01xVEhwTVgBYAE.787CvNM1y5_PbnUgJ0PsyU76GcRyYBwsXBxe0tUh4p79Q60QvNPqRwAEoOBxlY80i1wNBVgRJNx3sbJuXphvZg&X-Tos-Signature=248d559b6513255cc121e1c2c4081ab598f2057126ef3b7111dff1d3a53b2eab",
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
      url: "https://doc-review.tos-cn-beijing.volces.com/%E9%99%84%E4%BB%B63-%E4%B8%AD%E5%9B%BD%E5%B9%B3%E5%AE%89%E9%87%91%E8%A3%95%E4%BA%BA%E7%94%9F%E7%90%86%E8%B4%A2%E4%BA%A7%E5%93%81-f1689605-cfd0-4246-bd86-375a38526fce-1776655921492.docx?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=AKTP23R3oKR4PnicVxMBiuxewzA2rRJSNsQ77nLr67RTsW1%2F20260420%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260420T153647Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Security-Token=nChBvMlNIdFphUGtMcUtHWld2.CiQKEHVNU1JGYmN4M1BjUm9iVlMSEGzaxI5jAkjylcF414qeS4EQs42ZzwYYw6mZzwYgqvvC6wcoATCq-8LrBzoEcm9vdEIDdG9zUhcwNDg45omL5py655So5oi3I01xVEhwTVgBYAE.787CvNM1y5_PbnUgJ0PsyU76GcRyYBwsXBxe0tUh4p79Q60QvNPqRwAEoOBxlY80i1wNBVgRJNx3sbJuXphvZg&X-Tos-Signature=248d559b6513255cc121e1c2c4081ab598f2057126ef3b7111dff1d3a53b2eab",
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
