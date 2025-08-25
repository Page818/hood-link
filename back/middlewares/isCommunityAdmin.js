// middlewares/isCommunityAdmin.js
import Community from "../models/community.js";

export default async function isCommunityAdmin(req, res, next) {
	try {
		const { communityId } = req.params;
		if (!communityId)
			return res.status(400).json({ message: "communityId is required" });

		const comm = await Community.findById(communityId).select("admins");
		if (!comm) return res.status(404).json({ message: "Community not found" });

		const adminIds = (comm.admins || []).map((a) => a.toString());
		const uid = (req.user?._id || "").toString();

		if (!uid || !adminIds.includes(uid)) {
			return res
				.status(403)
				.json({ message: "Forbidden: not community admin" });
		}
		next();
	} catch (e) {
		console.error("[isCommunityAdmin] error:", e);
		res.status(500).json({ message: "Server error" });
	}
}
