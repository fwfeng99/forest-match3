# Windows x64 SDK 调用示例

`test.cpp` 用 `cv::imread()` 读取参考图和待检测图，然后以一个 group、一个 ROI 和一套检测参数调用 `vision_inspect()`。成功后打印 ROI 是否有效和检测到的缺陷，再释放结果。

把 `examples/test.cpp` 复制到 SDK 根目录，保留以下位置。DLL 文件名应与实际交付的构建产物一致。

```text
Defect_Inspection_SDK_x64/
├── test.cpp
├── include/vision/interface/
│   ├── vision_c_api.h
│   ├── vision_types.h
│   └── vision_export.h
├── lib/
│   └── vision.lib
├── bin/
│   ├── vision.dll
│   └── opencv_world310.dll
└── data/
    ├── Input/ref.bmp
    └── Origin/src.bmp
```

在 `data` 下放好两张同尺寸的 BMP。默认 ROI 为参考图上的 `{31, 41, 18, 10}`，可在 `test.cpp` 中修改 `refRoi` 和检测参数 `params`。

打开 **x64 Native Tools Command Prompt for Visual Studio**，进入 SDK 根目录。示例用 OpenCV 读取图像，因此编译时还需要 OpenCV 的头文件和导入库。下面以项目使用的 OpenCV 3.1 安装目录为例，按本机位置调整 `OPENCV_DIR`。

```bat
set "OPENCV_DIR=C:\opencv\build"
cl /nologo /EHsc /std:c++17 /I include /I "%OPENCV_DIR%\include" test.cpp lib\vision.lib "%OPENCV_DIR%\x64\vc14\lib\opencv_world310.lib" /Fe:bin\test.exe
```

`vision.lib` 用于链接检测接口，`opencv_world310.lib` 用于链接图像读取函数。生成的 `test.exe` 与两个 DLL 位于同一目录。从 SDK 根目录运行，程序会按相对路径读取 `data` 下的图像。

```bat
bin\test.exe
```

`ROI valid: 1` 表示 ROI 映射有效。`Defects` 是该 ROI 中的缺陷数量，具体值取决于输入图像。调用失败时会打印接口返回的错误码。
