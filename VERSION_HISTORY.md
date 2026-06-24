# Version History

Auto-generated from git log.

91d7cb8 fix: set WLR_RENDERER_ALLOW_SOFTWARE unconditionally
74541e7 docs: auto-update generated docs [skip ci]
a4c43d0 fix: add WLR_RENDERER_ALLOW_SOFTWARE=1 for software rendering
8318d36 docs: auto-update generated docs [skip ci]
7636755 fix: prevent WebGL crash loop in VM environments
7475d27 docs: auto-update generated docs [skip ci]
332729c fix: drop WLR_RENDERER=pixman so WebKit gets a working EGL context
c527366 docs: auto-update generated docs [skip ci]
ebde84f fix: use Mesa llvmpipe for WebKit rendering in VM environments
eb9b806 docs: auto-update generated docs [skip ci]
5a0de5e fix: enable WebKit software rendering in VM environments
cc3d303 docs: auto-update generated docs [skip ci]
e9e2629 fix: acquire sudo credentials before build starts
3edc34a docs: auto-update generated docs [skip ci]
ab949b1 fix: auto-detect missing GPU and fallback to pixman software renderer
7a67c1a docs: auto-update generated docs [skip ci]
4a4d98b fix: self-healing launcher that auto-installs deps and configures seat
eddb95d docs: auto-update generated docs [skip ci]
60fcd4c fix: use seatd as system service instead of bypassing it
5b1aafc docs: auto-update generated docs [skip ci]
1858099 fix: use LIBSEAT_BACKEND=logind in all launcher wrappers
03c2973 docs: auto-update generated docs [skip ci]
c523ff0 fix: disable system seatd and clean socket for seatd-launch to work
575ca8f docs: auto-update generated docs [skip ci]
d48dd6e fix: use seatd-launch to run cage without system seatd service
f30383d docs: auto-update generated docs [skip ci]
c203532 fix: add polkit so cage works immediately without seatd setup
543a772 docs: auto-update generated docs [skip ci]
9546bba fix: use seatd-launch for reliable cage startup without re-login
a0d335c docs: auto-update generated docs [skip ci]
a5941e7 fix: add seatd for cage GPU access on VMs and headless systems
3b24894 docs: auto-update generated docs [skip ci]
9deda43 fix: install cage launcher wrapper in update scripts
1d7de67 docs: auto-update generated docs [skip ci]
5481fdb feat: auto-launch cage when no display server is running
3a988f6 docs: auto-update generated docs [skip ci]
cce2abf feat: install display server by default, offer autostart toggle
32388b1 docs: update README for make update and GTK troubleshooting
db8f3e4 docs: auto-update generated docs [skip ci]
6403368 fix: make update auto-stash local changes instead of blocking
e4ddf28 docs: auto-update generated docs [skip ci]
803a418 feat: offer display server setup when none is detected
84f3093 docs: auto-update generated docs [skip ci]
e850ead refactor: rename mother-ui to muthur-ui
ea96bb1 docs: auto-update generated docs [skip ci]
4860c37 fix: resolve SCRIPT_DIR to project root, not scripts/
bb4d1dd docs: auto-update generated docs [skip ci]
2132c3c fix: use absolute path to src-tauri in build step
e3b1f17 docs: auto-update generated docs [skip ci]
d5d082b fix: build without bundling to avoid linuxdeploy dependency
