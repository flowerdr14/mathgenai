; Inno Setup Script for MATHGEN AI 3.1
; 작성된 경로: D:\Autobackup\Documents\mathgen-ai-3.1 (1)

[Setup]
AppId={{C6B8D1A0-B2A4-4E5E-A79B-89C3A0F8F1E2}}
AppName=MATHGEN AI 3.1
AppVersion=1.0.0
AppPublisher=MathGen AI Team
DefaultDirName={autopf}\MATHGEN AI 3.1
DefaultGroupName=MATHGEN AI 3.1
OutputDir=D:\Autobackup\Documents\mathgen-ai-3.1 (1)\dist-setup
OutputBaseFilename=MATHGEN_AI_3.1_Setup
SetupIconFile=D:\Autobackup\Documents\mathgen-ai-3.1 (1)\public\sfsfsfsfsafdf.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; electron-builder가 생성한 win-unpacked 폴더 내의 모든 파일을 포함합니다.
Source: "D:\Autobackup\Documents\mathgen-ai-3.1 (1)\dist-electron\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\MATHGEN AI 3.1"; Filename: "{app}\MATHGEN AI 3.1.exe"
Name: "{autodesktop}\MATHGEN AI 3.1"; Filename: "{app}\MATHGEN AI 3.1.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\MATHGEN AI 3.1.exe"; Description: "{cm:LaunchProgram,MATHGEN AI 3.1}"; Flags: nowait postinstall skipifsilent
