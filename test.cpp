#include "vision/interface/vision_c_api.h"

#include <iostream>
#include <limits>
#include <opencv2/imgcodecs.hpp>

int main()
{
    const cv::Mat referenceImage = cv::imread("data/Input/ref.bmp", cv::IMREAD_GRAYSCALE);
    const cv::Mat sourceImage = cv::imread("data/Origin/src.bmp", cv::IMREAD_GRAYSCALE);

    const VisionRoi refRoi{31, 41, 18, 10};

    VisionDefectParams params{};
    params.lowerGrayLevel = 0;
    params.upperGrayLevel = 120;
    params.localTolerance = 30;
    params.minArea = 10;
    params.maxArea = std::numeric_limits<int>::max();

    VisionRoiDetectionGroup group{};
    group.zoneId = 1;
    group.refBounds = refRoi;
    group.refRois = &refRoi;
    group.roiCount = 1;
    group.groupParams = {
        params.lowerGrayLevel,
        params.upperGrayLevel,
        params.minArea,
        params.maxArea
    };

    VisionDefectDetectionInput input{};
    input.refData = referenceImage.data;
    input.refStep = static_cast<int>(referenceImage.step);
    input.refWidth = referenceImage.cols;
    input.refHeight = referenceImage.rows;
    input.refImageType = VISION_IMAGE_8UC1;
    input.defaultParams = params;
    input.roiGroups = &group;
    input.groupCount = 1;

    VisionInspectionResult* result = nullptr;
    const int status = vision_inspect(
        sourceImage.data,
        static_cast<int>(sourceImage.step),
        sourceImage.cols,
        sourceImage.rows,
        VISION_IMAGE_8UC1,
        &input,
        &result
    );
    if (status != 0) {
        std::cerr << "vision_inspect failed: " << status << '\n';
        return 1;
    }

    std::cout << "ROI valid: " << static_cast<int>(result->roi_valid[0]) << '\n';
    std::cout << "Defects: " << result->defect_count << '\n';
    for (int i = 0; i < result->defect_count; ++i) {
        const VisionDefect& defect = result->defects[i];
        std::cout << "x=" << defect.x << ", y=" << defect.y
                  << ", width=" << defect.width << ", height=" << defect.height
                  << ", area=" << defect.area << '\n';
    }

    vision_release_inspection_result(result);
    return 0;
}
