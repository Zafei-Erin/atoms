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
      url: "https://doc-review.tos-cn-beijing.volces.com/%E9%99%84%E4%BB%B63-%E4%B8%AD%E5%9B%BD%E5%B9%B3%E5%AE%89%E9%87%91%E8%A3%95%E4%BA%BA%E7%94%9F%E7%90%86%E8%B4%A2%E4%BA%A7%E5%93%81-f1689605-cfd0-4246-bd86-375a38526fce-1776655921492.docx?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=AKTP23R3oKR4PnicVxMBiuxex3Iz1bSDPQmiXmlugb3MJrr%2F20260420%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260420T140914Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Security-Token=nChBvMlNIdFphUGtMcUtHWld2.CiQKEHVNU1JGYmN4M1BjUm9iVlMSEPUEzBCt5EaMgyGoHGzGdLcQo-WYzwYYs4GZzwYgqvvC6wcoATCq-8LrBzoEcm9vdEIDdG9zUhcwNDg45omL5py655So5oi3I01xVEhwTVgBYAE.GtGP9violMqNPjm3Qrkk9jgCLAvaTl1jXNesTjP1iBhvmdDHxje_HDY93NU9fPBRFde07uwh0EBRJN5qyo5vxA&X-Tos-Signature=d636421c32d462a50418836b5a252f5be75a57aaa1fd27058a50336e2bb7e67c",
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
      url: "https://doc-review.tos-cn-beijing.volces.com/%E9%99%84%E4%BB%B63-%E4%B8%AD%E5%9B%BD%E5%B9%B3%E5%AE%89%E9%87%91%E8%A3%95%E4%BA%BA%E7%94%9F%E7%90%86%E8%B4%A2%E4%BA%A7%E5%93%81-f1689605-cfd0-4246-bd86-375a38526fce-1776655921492.docx?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Content-Sha256=UNSIGNED-PAYLOAD&X-Tos-Credential=AKTP23R3oKR4PnicVxMBiuxex3Iz1bSDPQmiXmlugb3MJrr%2F20260420%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260420T140914Z&X-Tos-Expires=3600&X-Tos-SignedHeaders=host&X-Tos-Security-Token=nChBvMlNIdFphUGtMcUtHWld2.CiQKEHVNU1JGYmN4M1BjUm9iVlMSEPUEzBCt5EaMgyGoHGzGdLcQo-WYzwYYs4GZzwYgqvvC6wcoATCq-8LrBzoEcm9vdEIDdG9zUhcwNDg45omL5py655So5oi3I01xVEhwTVgBYAE.GtGP9violMqNPjm3Qrkk9jgCLAvaTl1jXNesTjP1iBhvmdDHxje_HDY93NU9fPBRFde07uwh0EBRJN5qyo5vxA&X-Tos-Signature=d636421c32d462a50418836b5a252f5be75a57aaa1fd27058a50336e2bb7e67c",
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
