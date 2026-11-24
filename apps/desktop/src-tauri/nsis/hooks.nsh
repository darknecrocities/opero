; OPERO Windows NSIS Installer Hooks
; Automatically detects and silently uninstalls any existing OPERO binary
; before installing the new version, preserving user SQLite data in %APPDATA%\com.mmi.opero.

!macro NSIS_HOOK_PREINSTALL
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\OPERO" "UninstallString"
  StrCmp $R0 "" check_hklm_opero
  DetailPrint "Existing OPERO installation detected. Replacing cleanly..."
  ExecWait '$R0 /S _?=$INSTDIR'
  Goto done_opero_preinstall

check_hklm_opero:
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\OPERO" "UninstallString"
  StrCmp $R0 "" done_opero_preinstall
  DetailPrint "Existing system OPERO installation detected. Replacing cleanly..."
  ExecWait '$R0 /S _?=$INSTDIR'

done_opero_preinstall:
!macroend
