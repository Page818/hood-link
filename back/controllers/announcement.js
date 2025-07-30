// controllers/announcement.js
import Announcement from "../models/announcement.js";
import Community from "../models/community.js";
import { StatusCodes } from "http-status-codes";

// 發布公告
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, image, communityId, pinned } = req.body;

    // 檢查必要欄位
    if (!title || !content || !communityId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "請提供標題、內容與社區 ID",
      });
    }

    // 確認社區存在
    const community = await Community.findById(communityId);
    
    if (!community) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "找不到對應社區",
      });
    }

    // 僅社區建立者可發佈公告（也可改為包含社區管理員）
    if (community.creator.toString() !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "你沒有權限發佈公告",
      });
    }

    // 若要置頂，先取消原本已置頂的公告（每個社區只能有一篇置頂）
    if (pinned) {
      await Announcement.updateMany(
        { community: communityId, pinned: true },
        { pinned: false }
      );
    }

    const newAnnouncement = new Announcement({
      title,
      content,
      image,
      pinned: !!pinned,
      community: communityId,
      creator: req.user._id,
    });

    await newAnnouncement.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "公告已發佈",
      announcement: newAnnouncement,
    });
  } catch (err) {
    console.error("❌ 發佈公告失敗", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "無法發佈公告",
    });
  }
};
