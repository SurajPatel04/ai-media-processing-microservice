import { ApiResponse } from "../utils/apiResponse.utils.js"
import { logInfo, logWarn } from "../utils/logHelper.utils.js"
import { asyncHandler } from "../utils/asyncHandler.utils.js"
export const getCurrentUser = asyncHandler(
    async (req, res) => {
        logInfo("Current user fetched successfully", req, { userId: req.user._id });
        return res.status(200).json(
            new ApiResponse(200, { user: req.user }, "Current user fetched successfully")
        );
    }
)