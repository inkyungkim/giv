'use strict';

/*******************************
 *  Gallery Image Viewer
 *
 *  = prog by IKK, 2014
 *
 * [construct options]
 *   id: dom id
 *   data: image data array
 *
 *  __givIN : global instance name
 *
 */

class giViewer {
    _version = '0.9.64';
    isMobile = false;

    _el = {
        doc: undefined,
        html: undefined,
        body: undefined,
        el: undefined,
        container: undefined,
        currImg: undefined,

        exif: undefined,
        bottomPannel: undefined,
        bottomPannelToggle: undefined,

        btnClose: undefined,
        btnPrev: undefined,
        btnNext: undefined,

        btnExif: undefined,
        btnDownload: undefined,
        btnExport: undefined,
        btnFullscreen: undefined,

        btnPlay: undefined,
        btnStop: undefined,
        btnForward: undefined,
        btnRandom: undefined,
        btnBackward: undefined,
        btnThreshold5: undefined,
        btnThreshold10: undefined,
        btnThreshold15: undefined,
        btnThreshold20: undefined,
        btnThreshold30: undefined,
    };

    data = new Array();
    selectIndex = 0;

    fullscreenMode = false;      // use fullscreen mode
    buttonDownload = false;      // download button
    buttonExport = false;        // export button

    nav = {
        TH_WIDTH: 60,
        el: undefined,
        elPrev: undefined,
        elNext: undefined,
        elContainer: undefined,
        elImgList: undefined,
        elImgs: undefined,
        imgListWidth: 60,
        tranX: 0,
        lesser: false,
        drag: false,
        lastClientX: 0,
    };

    // container gesture event
    ctGs = {
        drag: false,
        lastClientX: null,
    };

    // slide
    slide = {
        play: false,
        timer: null,
        threshold: 4000,
        playOrder: 'F',     // F: Forward(increase), B: Backward(decrease), R: random
    };

    // zoom layer-popup
    zoom = {
        SCALE_STEP: 0.2,
        MAX_SCALE: 1.5,     // calc at view zoom

        view: false,
        viewOrg: false,
        el: undefined,
        elContainer: undefined,
        elImage: undefined,

        scale: 1,
        tranX: 0,
        tranY: 0,
        drag: false,
        clickLastTime: new Date().getTime(),
        lastClientX: null,
        lastClientY: null,
        gsLastClientX: null,
        gsLastTime: new Date().getTime(),
    }

    // var for mobile pinch event handling
    evCache = new Array();
    prevDiff = -1;

    // animation option
    ani = {
        type: '',     //  'fofi': fadeout fadein
        kfFadein: [
            { opacity: '0' },
            { opacity: '0.75', offset: 0.7 },
            { opacity: '1' }
        ],
        kfFadeout: [
            { opacity: '1' },
            { opacity: '0.75', offset: 0.3 },
            { opacity: '0' }
        ],
        option: {
            duration: 800,
            // iterations: Infinity,
        }
    };

    constructor(opt) {
        const DEFAULT_THRESHOULD = 5000;

        const ua = navigator.userAgent;
        if (ua.match(/iPhone|iPod|Android|Windows CE|BlackBerry|Symbian|Windows Phone|webOS|Opera Mini|Opera Mobi|POLARIS|IEMobile|lgtelecom|nokia|SonyEricsson/i) != null
            || ua.match(/LG|SAMSUNG|Samsung/) != null) {
            this.isMobile = true;
        }

        this._el.html = document.querySelector('html');
        this._el.body = document.querySelector('body');

        // create Viewer's root DOM width id, class
        const n = document.createElement('div');
        n.id = opt.id;
        n.classList.add('giViewer');
        document.body.appendChild(n);
        this._el.el = document.getElementById(opt.id);

        // sets data
        this.data = Object.assign([], opt.data);

        this.buttonDownload = opt.buttonDownload;
        this.buttonExport = opt.buttonExport;

        const showExif = (this.#_getCookie('giViewerExif') == 'true');
        this.fullscreenMode = (this.#_getCookie('giViewerFullscreen') == 'true');
        const threshold = this.#_getCookie('giViewerSlideThreshold');
        this.slide.threshold = (threshold ? parseInt(threshold) : DEFAULT_THRESHOULD);

        // create base UI DOM
        this._el.el.innerHTML = `
<div class="giViewer-container">
    <div class="img-view">
        <img class="current-img">

        <i class="fas fa-times btn-close" title="[X] close"></i>
        <i class="fas fa-chevron-left btn-prev" title="[Left] previous image\n[Home] First image"></i>
        <i class="fas fa-chevron-right btn-next" title="[Right] next image\n[End] Last image"></i>

        <div class="bottom-pannel">
            <div class="bottom-pannel-container">

                <span class="btn-rect i5">5</span>
                <span class="btn-rect i10">10</span>
                <span class="btn-rect i15">15</span>
                <span class="btn-rect i20">20</span>
                <span class="btn-rect i30">30</span>

                <span class="btn-rect btn-backward"><i class="fa fa-caret-left"></i></span>
                <span class="btn-rect btn-random"><i class="fa fa-random"></i></span>
                <span class="btn-rect btn-forward"><i class="fa fa-caret-right"></i></span>

                <span class="btn-rect btn-stop"><i class="fa fa-stop"></i></span>

                ${(this.buttonExport ? '<i class="fa fa-mail-forward btn-export" tile="[B] Export Best"></i>' : '')}
                ${(this.buttonDownload ? '<i class="fa fa-download btn-download" title="[D] Download"></i>' : '')}
                <i class="fa fa-expand btn-fullscreen ${this.fullscreenMode ? 'on' : ''}" title="[F] Zoom width fullscreen"></i>
                <i class="fa fa-camera btn-exif ${showExif ? 'on' : ''}" title="[E] View EXIF info"></i>
                <i class="fa fa-circle-play btn-play" title="[P] Play/Stop slide show"></i>

                <div class="toggle"><i class="fa fa-arrow-down-up-across-line"></i></div>
            </div>
        </div>

        <div class="exif ${showExif ? 'on' : ''}"></div>
    </div>
</div>

<div class="img-nav">
    <div class="img-nav-container">
        <div class="prevArea"><i class="fa fa-chevron-left navbtn-prev"></i></div>
        <div class="imglist-container">
            <ul class="imglist"></ul>
        </div>
        <div class="nextArea"><i class="fa fa-chevron-right navbtn-next"></i></div>
    </div>
</div>`;

        this._el.container = this._el.el.querySelector('.giViewer-container');

        this._el.currImg = this._el.el.querySelector('.img-view .current-img');
        this._el.currImg.addEventListener('click', () => this.zoomImage());

        this._el.exif = this._el.el.querySelector('.img-view .exif');
        this._el.bottomPannel = this._el.el.querySelector('.img-view .bottom-pannel');
        this._el.bottomPannelToggle = this._el.bottomPannel.querySelector('.bottom-pannel-container .toggle');
        this._el.bottomPannelToggle.addEventListener('click', () => this.toggleRightPanel());

        this._el.btnClose = this._el.el.querySelector('.img-view .btn-close');
        this._el.btnClose.addEventListener('click', () => this.hide());
        this._el.btnPrev = this._el.el.querySelector('.img-view .btn-prev');
        this._el.btnPrev.addEventListener('click', () => this.navPrev());
        this._el.btnNext = this._el.el.querySelector('.img-view .btn-next');
        this._el.btnNext.addEventListener('click', () => this.navNext());

        this._el.btnExif = this._el.el.querySelector('.img-view .btn-exif');
        this._el.btnExif.addEventListener('click', () => this.toggleExif());

        if (this.buttonDownload) {
            this._el.btnDownload = this._el.el.querySelector('.img-view .btn-download');
            this._el.btnDownload.addEventListener('click', () => this.download());
        }
        if (this.buttonExport) {
            this._el.btnExport = this._el.el.querySelector('.img-view .btn-export');
            this._el.btnExport.addEventListener('click', () => this.export());
        }
        this._el.btnFullscreen = this._el.el.querySelector('.img-view .btn-fullscreen');
        this._el.btnFullscreen.addEventListener('click', () => this.toggleZoomFullscreen());
        this._el.btnPlay = this._el.el.querySelector('.img-view .btn-play');
        this._el.btnPlay.addEventListener('click', () => this.tooglePlay());
        this._el.btnStop = this._el.el.querySelector('.img-view .btn-stop');
        this._el.btnStop.addEventListener('click', () => this.tooglePlay());

        this._el.btnForward = this._el.el.querySelector('.img-view .btn-forward');
        this._el.btnForward.addEventListener('click', () => this.slideForward());
        this._el.btnRandom = this._el.el.querySelector('.img-view .btn-random');
        this._el.btnRandom.addEventListener('click', () => this.slideRandom());
        this._el.btnBackward = this._el.el.querySelector('.img-view .btn-backward');
        this._el.btnBackward.addEventListener('click', () => this.slideBackward());

        this._el.btnThreshold5 = this._el.el.querySelector('.img-view .btn-rect.i5');
        this._el.btnThreshold5.addEventListener('click', () => this.slideThreshold(5));
        this._el.btnThreshold10 = this._el.el.querySelector('.img-view .btn-rect.i10');
        this._el.btnThreshold10.addEventListener('click', () => this.slideThreshold(10));
        this._el.btnThreshold15 = this._el.el.querySelector('.img-view .btn-rect.i15');
        this._el.btnThreshold15.addEventListener('click', () => this.slideThreshold(15));
        this._el.btnThreshold20 = this._el.el.querySelector('.img-view .btn-rect.i20');
        this._el.btnThreshold20.addEventListener('click', () => this.slideThreshold(20));
        this._el.btnThreshold30 = this._el.el.querySelector('.img-view .btn-rect.i30');
        this._el.btnThreshold30.addEventListener('click', () => this.slideThreshold(30));

        if (this.isMobile) {
            this._el.container.onpointerdown = this.__ctPointerDownHandler;
            this._el.container.onpointerup = this.__ctPointerUpHandler;
            this._el.container.onpointercancel = this.__ctPointerUpHandler;
            this._el.container.onpointerout = this.__ctPointerUpHandler;
            this._el.container.onpointerleave = this.__ctPointerUpHandler;
        }

        window.addEventListener('resize', this.__fixNav());
        this.#_setNav();
    }

    hide() {
        this.stopSlide();
        this.zoomClose();
        this._el.el.classList.remove('on');
        this._el.html.classList.remove('overFix');
        this._el.body.classList.remove('overFix');

        // remove key event Listener
        document.removeEventListener("keydown", this.__keyEventHandler, true);

        // remove fullscreen exit event Listner
        document.removeEventListener('fullscreenchange', this.__fsExitHandler, true);
        document.removeEventListener('webkitfullscreenchange', this.__fsExitHandler, true);
        document.removeEventListener('mozfullscreenchange', this.__fsExitHandler, true);
        document.removeEventListener('MSFullscreenChange', this.__fsExitHandler, true);
    }

    show(idx) {
        this.selectIndex = idx;

        this._el.currImg.classList.add('fadeout');
        this._el.currImg.src = this.data[idx].ImageRoot + '/prv/' + this.data[idx].FileName;

        setTimeout(() => {
            this._el.currImg.classList.remove('fadeout');
            this._el.currImg.animate(this.ani.kfFadein, this.ani.option);
        }, 100);
        this._el.exif.innerHTML = this.#_getHTMLExif(this.data[idx]);
        this.#_checkButtonStatus();

        this._el.el.classList.add('on');
        this._el.html.classList.add('overFix');
        this._el.body.classList.add('overFix');

        // start key event Listener
        document.addEventListener("keydown", this.__keyEventHandler, true);

        // fullscreen exit event Listner
        document.addEventListener('fullscreenchange', this.__fsExitHandler, true);
        document.addEventListener('webkitfullscreenchange', this.__fsExitHandler, true);
        document.addEventListener('mozfullscreenchange', this.__fsExitHandler, true);
        document.addEventListener('MSFullscreenChange', this.__fsExitHandler, true);

        // must last line
        this.__fixNav();
    }

    __keyEventHandler(e) {
        const ESC = 27;
        const LEFT = 37;     // previous
        const RIGHT = 39;    // next
        const HOME = 36;     // first
        const END = 35;      // last

        const KEY_D = 68;    // Download
        const KEY_E = 69;    // Exif
        const KEY_F = 70;    // Fiullscreen
        const KEY_P = 80;    // Play slide
        const KEY_X = 88;    // eXit
        const KEY_Z = 90;    // Zoom

        // console.log('__keyEventHandler => ', e.keyCode);

        switch (e.keyCode) {
            case ESC:
                if (window[__givIN].slide.play) {
                    window[__givIN].stopSlide();
                }
                if (window[__givIN].zoom.view) {
                    window[__givIN].zoomClose();
                }
                break;
            case RIGHT:
                if (!window[__givIN].slide.play) {
                    window[__givIN].navNext();
                }
                break;
            case LEFT:
                if (!window[__givIN].slide.play) {
                    window[__givIN].navPrev();
                }
                break;
            case HOME:
                if (!window[__givIN].slide.play) {
                    window[__givIN].selectImage(0);
                }
                break;
            case END:
                if (!window[__givIN].slide.play) {
                    window[__givIN].selectImage(window[__givIN].data.length - 1);
                }
                break;
            case KEY_D:
                window[__givIN].download();
                break;
            case KEY_E:
                window[__givIN].toggleExif();
                break;
            case KEY_F:
                window[__givIN].toggleZoomFullscreen();
                break;
            case KEY_P:
                window[__givIN].tooglePlay();
                break;
            case KEY_X:
                window[__givIN].hide();
                break;
            case KEY_Z:
                if (window[__givIN].zoom.view) {
                    window[__givIN].zoomClose();
                } else {
                    window[__givIN].zoomImage();
                }
                break;
            default:
        }
    }

    __fsExitHandler() {
        if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
            // checks playing slide
            if (window[__givIN].slide.play) {
                window[__givIN].stopSlide();
            }

            // checks zoom view
            if (window[__givIN].zoom.view) {
                window[__givIN].zoomClose();
            }
        }
    }

    // img container 'pointdown'
    __ctPointerDownHandler(e) {
        window[__givIN].ctGs.drag = true;
        window[__givIN].ctGs.lastClientX = e.clientX;
        e.preventDefault();
    }
    // img container 'pointup'
    __ctPointerUpHandler(e) {
        if (window[__givIN].ctGs.drag) {
            const diff = Math.abs(window[__givIN].ctGs.lastClientX - e.clientX);

            if (diff > 50) {
                if ((window[__givIN].ctGs.lastClientX - e.clientX) > 0) {
                    window[__givIN].navNext();
                    // console.log('navNext()');
                } else {
                    window[__givIN].navPrev();
                    // console.log('navPrev()');
                }
            }
        }
        window[__givIN].ctGs.drag = false;
        e.preventDefault();
    }


    selectImage(idx) {
        this.selectIndex = idx;

        // fadeout fadein
        if (this.ani.type === 'fofi') {
            this._el.currImg.animate(this.ani.kfFadeout, this.ani.option);
            setTimeout(() => this._el.currImg.classList.add('fadeout'), (this.ani.option.duration - 100));

            setTimeout(() => {
                this._el.currImg.src = this.data[idx].ImageRoot + '/prv/' + this.data[idx].FileName;
                setTimeout(() => {
                    this._el.currImg.classList.remove('fadeout');
                    this._el.currImg.animate(this.ani.kfFadein, this.ani.option);
                }, 200);
            }, this.ani.option.duration);
        } else {
            this._el.currImg.src = this.data[idx].ImageRoot + '/prv/' + this.data[idx].FileName;
        }

        this._el.exif.innerHTML = this.#_getHTMLExif(this.data[idx]);
        this.#_checkButtonStatus();
        this.__fixNav();
    }

    zoomImage() {

        if (!this.fullscreenMode || !this.slide.play) {

            this.stopSlide();

            this.zoom.MAX_SCALE = (parseInt(this.data[this.selectIndex].Height) / window.innerHeight);

            const imgUrl = this.data[this.selectIndex].ImageRoot + '/org/' + this.data[this.selectIndex].FileName;
            const n = document.createElement('div');
            n.classList.add('zoom-modal');

            let h = '';
            if (this.isMobile) {
                h += `<div class="zoom-guide mobile"><i class="fa fa-backspace" onclick="${__givIN}.zoomClose()"></i></div>`;
            } else {
                h += `<div class="zoom-guide">
                    Esc, Z : <span onclick="${__givIN}.zoomClose()">Exit</span><br>
                    Mouse Wheel : Zoom in/out<br>
                    Drag : Move Image<br>
                    Dbl Click : Fit/Origin<br>
                </div>`;
            }
            h += `<div class="zoom-photo-container"><img src="${imgUrl}" onload="KUI.ui.block.hide();" ></div>`;

            n.innerHTML = h;
            document.body.appendChild(n);

            this.zoom.el = document.querySelector('div.zoom-modal');
            this.zoom.elContainer = document.querySelector('div.zoom-photo-container');
            this.zoom.elImage = document.querySelector('div.zoom-photo-container > img');

            this.zoom.view = true;
            this.zoom.viewOrg = false;
            this.zoom.scale = 1;
            this.zoom.tranX = 0;
            this.zoom.tranY = 0;

            if (this.fullscreenMode) {
                if (document.fullscreenEnabled) {
                    this.zoom.el.requestFullscreen().catch((err) => {
                        alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
                    });
                } else {
                    console.info('document.fullscreenEnabled is disabled');
                }
            }

            if (this.isMobile) {
                this.zoom.SCALE_STEP = 0.1;
                this.zoom.elContainer.classList.add('stop-tran');  // no animation

                // pinch action ---
                // Install event handlers for the pointer target
                this.zoom.elContainer.onpointerdown = this.__zcPointerDownHandler;
                this.zoom.elContainer.onpointermove = this.__zcPointerMoveHandler;

                // Use same handler for pointer{up,cancel,out,leave} events since
                // the semantics for these events - in this app - are the same.
                this.zoom.elContainer.onpointerup = this.__zcPointerUpHandler;
                this.zoom.elContainer.onpointercancel = this.__zcPointerUpHandler;
                this.zoom.elContainer.onpointerout = this.__zcPointerUpHandler;
                this.zoom.elContainer.onpointerleave = this.__zcPointerUpHandler;

                // for pc emul test
                document.addEventListener('wheel', this.__zcWheelEventHandler, true);

            } else {
                this.zoom.SCALE_STEP = 0.2;

                this.zoom.elContainer.addEventListener('mousedown', this.__zcmdEventHandler, true);

                window.addEventListener('mouseup', this.__zcmuEventHandler, true);
                window.addEventListener('mousemove', this.__zcmmEventHandler, true);
                document.addEventListener('wheel', this.__zcWheelEventHandler, true);

                document.ondblclick = this.__zcDblClick;
            }

        }
    }
    zoomClose() {
        if (this.isMobile) {
            this.zoom.elContainer = null;
        } else {
            window.removeEventListener('mouseup', this.__zcmuEventHandler, true);
            window.removeEventListener('mousemove', this.__zcmmEventHandler, true);
            document.removeEventListener('wheel', this.__zcWheelEventHandler, true);
            document.ondblclick = null;
        }

        if (this.fullscreenMode && document.fullscreenElement) {
            document.exitFullscreen();
        }
        if (this.zoom.el) {
            this.zoom.el.remove();
        }
        this.zoom.view = false;
    }

    zoomImageReset() {
        // fadeout fadein
        if (this.ani.type === 'fofi') {
            this.zoom.elImage.animate(this.ani.kfFadeout, this.ani.option);
            setTimeout(() => this.zoom.elImage.classList.add('fadeout'), (this.ani.option.duration - 100));

            setTimeout(() => {
                this.zoom.elImage.src = this.data[this.selectIndex].ImageRoot + '/org/' + this.data[this.selectIndex].FileName;
                setTimeout(() => {
                    this.zoom.elImage.classList.remove('fadeout');
                    this.zoom.elImage.animate(this.ani.kfFadein, this.ani.option);
                }, 200);
            }, this.ani.option.duration);
        } else {
            this.zoom.elImage.src = this.data[this.selectIndex].ImageRoot + '/org/' + this.data[this.selectIndex].FileName;
            KUI.ui.block.show();
        }

        this.zoom.MAX_SCALE = (parseInt(this.data[this.selectIndex].Height) / window.innerHeight);
        this.zoom.viewOrg = false;
        this.zoom.scale = 1;
        this.zoom.tranX = 0;
        this.zoom.tranY = 0;
        this.zoom.elContainer.style.transform = 'scale(1) translate( 0, 0)';
    }

    __zcDblClick(e) {
        // console.log('ondblclick', e);
        // console.log(document.elementFromPoint(e.pageX, e.pageY));

        if (document.elementFromPoint(e.pageX, e.pageY) == window[__givIN].zoom.elImage) {

            if (window[__givIN].zoom.viewOrg) {

                window[__givIN].zoom.scale = 1;
                window[__givIN].zoom.tranX = 0;
                window[__givIN].zoom.tranY = 0;

                window[__givIN].zoom.elContainer.style.transform = 'scale(1) translate( 0, 0)';

                window[__givIN].zoom.viewOrg = false;

            } else {

                window[__givIN].zoom.scale = window[__givIN].zoom.MAX_SCALE;

                const rateX = e.offsetX / window[__givIN].zoom.elImage.width;
                const rateY = e.offsetY / window[__givIN].zoom.elImage.height;
                let maxX = Math.floor(((window.innerWidth * window[__givIN].zoom.scale) - window.innerWidth) / (window[__givIN].zoom.scale * 2));
                let maxY = Math.floor(((window.innerHeight * window[__givIN].zoom.scale) - window.innerHeight) / (window[__givIN].zoom.scale * 2));

                if (rateX < 0.5) {
                    window[__givIN].zoom.tranX = parseInt(((0.5 - rateX) * 2) * maxX);
                } else {
                    window[__givIN].zoom.tranX = - parseInt(((rateX - 0.5) * 2) * maxX);
                }

                if (rateY < 0.5) {
                    window[__givIN].zoom.tranY = parseInt(((0.5 - rateY) * 2) * maxY);
                } else {
                    window[__givIN].zoom.tranY = - parseInt(((rateY - 0.5) * 2) * maxY);
                }

                // rate => img : container
                const rateContainerX = window[__givIN].zoom.elImage.clientWidth / window[__givIN].zoom.elContainer.clientWidth;
                const rateContainerY = window[__givIN].zoom.elImage.clientHeight / window[__givIN].zoom.elContainer.clientHeight;

                window[__givIN].zoom.tranX = parseInt(window[__givIN].zoom.tranX * rateContainerX);
                window[__givIN].zoom.tranY = parseInt(window[__givIN].zoom.tranY * rateContainerY);

                // console.log(e.offsetX, e.offsetY, 'rate', rateX, rateY, 'max', maxX, maxY, 'tran', window[__givIN].zoom.tranX, window[__givIN].zoom.tranY);

                window[__givIN].calibrateZoomTran();
                window[__givIN].zoom.elContainer.style.transform =
                    'scale(' + window[__givIN].zoom.MAX_SCALE + ') translate( ' + window[__givIN].zoom.tranX + 'px, ' + window[__givIN].zoom.tranY + 'px )';

                window[__givIN].zoom.viewOrg = true;
            }
        }
    }

    // zoom container 'mousedown'
    __zcmdEventHandler(e) {
        window[__givIN].zoom.elContainer.style.cursor = 'pointer';
        window[__givIN].zoom.elContainer.classList.add('stop-tran');  // no animation

        if (!window[__givIN].zoom.elContainer.hasAttribute('nochilddrag')
            || document.elementFromPoint(e.pageX, e.pageY) == window[__givIN].zoom.elContainer
            || document.elementFromPoint(e.pageX, e.pageY) == window[__givIN].zoom.elImage) {

            window[__givIN].zoom.drag = true;
            window[__givIN].zoom.lastClientX = e.clientX;
            window[__givIN].zoom.lastClientY = e.clientY;
            e.preventDefault();
        }
    }
    // zoom container 'mouseup'
    __zcmuEventHandler(e) {
        window[__givIN].zoom.drag = false;
        window[__givIN].zoom.elContainer.style.cursor = 'auto';
        window[__givIN].zoom.elContainer.classList.remove('stop-tran');  // reset animation
    }

    // zoom container 'mousemove'
    __zcmmEventHandler(e) {
        if (window[__givIN].zoom.drag) {
            window[__givIN].zoom.tranX -= (window[__givIN].zoom.lastClientX - e.clientX);
            window[__givIN].zoom.tranY -= (window[__givIN].zoom.lastClientY - e.clientY);
            window[__givIN].zoom.lastClientX = e.clientX;
            window[__givIN].zoom.lastClientY = e.clientY;

            window[__givIN].calibrateZoomTran();
            window[__givIN].zoom.elContainer.style.transform =
                'scale(' + window[__givIN].zoom.scale + ') translate( ' + window[__givIN].zoom.tranX + 'px, ' + window[__givIN].zoom.tranY + 'px )';
        }
    }

    // zoom container 'wheel'
    __zcWheelEventHandler(e) {
        if (e.deltaY < 0) {
            window[__givIN].zoom.scale += window[__givIN].zoom.SCALE_STEP;
            if (window[__givIN].zoom.scale > window[__givIN].zoom.MAX_SCALE) {
                window[__givIN].zoom.scale = window[__givIN].zoom.MAX_SCALE;
            }
        } else {
            window[__givIN].zoom.scale -= window[__givIN].zoom.SCALE_STEP;
            if (window[__givIN].zoom.scale < 1) {
                window[__givIN].zoom.scale = 1;
            }
        }
        window[__givIN].zoom.scale = Math.round(window[__givIN].zoom.scale * 10) / 10;

        window[__givIN].calibrateZoomTran();
        window[__givIN].zoom.elContainer.style.transform =
            'scale(' + window[__givIN].zoom.scale + ') translate( ' + window[__givIN].zoom.tranX + 'px, ' + window[__givIN].zoom.tranY + 'px )';
    }

    // zoom container 'pointdown'
    __zcPointerDownHandler(e) {
        // The pointerdown event signals the start of a touch interaction.
        // This event is cached to support 2-finger gestures
        window[__givIN].evCache.push(e);
        // console.log("pointerDown/touch start", ev);
        // window[__givIN].zoom.elContainer.classList.add('stop-tran');  // no animation

        window[__givIN].zoom.drag = true;
        window[__givIN].zoom.gsLastClientX = e.clientX;
        window[__givIN].zoom.lastClientX = e.clientX;
        window[__givIN].zoom.lastClientY = e.clientY;
        e.preventDefault();

        const nowTime = new Date().getTime();
        // console.log('zcPD', window[__givIN].zoom.clickLastTime, nowTime, (nowTime - window[__givIN].zoom.clickLastTime));

        // Check less than 250ms
        // if ((nowTime - window[__givIN].zoom.clickLastTime) < 250) {
        //     console.log('emul double click');
        //     window[__givIN].__zcDblClick(e);
        // }

        window[__givIN].zoom.clickLastTime = nowTime;
        // console.log('zcPD', window[__givIN].zoom.gsLastClientX, e.clientX);
    }

    // zoom container 'pointup'
    __zcPointerUpHandler(e) {
        // console.log(ev.type, ev);
        // Remove this pointer from the cache and reset the target's
        // background and border
        window[__givIN].removeEvent(e);
        // console.log('touch end');
        window[__givIN].zoom.drag = false;
        // window[__givIN].zoom.elContainer.classList.remove('stop-tran');  // reset animation

        // If the number of pointers down is less than two then reset diff tracker
        if (window[__givIN].evCache.length < 2) {
            window[__givIN].prevDiff = -1;
        }

        // checks fit mode and then gesture event
        if (window[__givIN].zoom.scale === 1) {
            const diff = Math.abs(window[__givIN].zoom.gsLastClientX - e.clientX);
            const nowTime = new Date().getTime();

            // Check 15ms elapsed time (distance : 60)
            if ((diff > 60) && (nowTime - window[__givIN].zoom.gsLastTime) > 15) {
                window[__givIN].zoom.gsLastTime = nowTime;
                if ((window[__givIN].zoom.gsLastClientX - e.clientX) > 0) {
                    window[__givIN].navNext();
                    // console.log('ZCP navNext()', nowTime);
                } else {
                    window[__givIN].navPrev();
                    // console.log('navPrev()', nowTime);
                }
            }
            // console.log('zcPU GS', diff, window[__givIN].zoom.gsLastClientX, e.clientX);
        } else {
            // console.log('zcPU', window[__givIN].zoom.gsLastClientX, e.clientX);
        }
    }
    // zoom container 'pointmove'
    __zcPointerMoveHandler(e) {
        // This function implements a 2-pointer horizontal pinch/zoom gesture.
        //
        // If the distance between the two pointers has increased (zoom in),
        // the target element's background is changed to "pink" and if the
        // distance is decreasing (zoom out), the color is changed to "lightblue".
        const RESPONSIVENESS = 1.5;

        // Find this event in the cache and update its record with this event
        const index = window[__givIN].evCache.findIndex(
            (cachedEv) => cachedEv.pointerId === e.pointerId,
        );
        window[__givIN].evCache[index] = e;

        // If two pointers are down, check for pinch gestures
        if (window[__givIN].evCache.length === 2) {
            // Calculate the distance between the two pointers
            const curDiff = Math.abs(window[__givIN].evCache[0].clientX - window[__givIN].evCache[1].clientX);
            const absDiff = Math.abs(curDiff - window[__givIN].prevDiff);
            // console.log(absDiff);

            if (window[__givIN].prevDiff > 0 && absDiff > RESPONSIVENESS) {
                if (curDiff > window[__givIN].prevDiff) {
                    // The distance between the two pointers has increased
                    // console.log("Pinch moving OUT -> Zoom in", ev);
                    window[__givIN].zoom.scale += window[__givIN].zoom.SCALE_STEP;
                    if (window[__givIN].zoom.scale > window[__givIN].zoom.MAX_SCALE) {
                        window[__givIN].zoom.scale = window[__givIN].zoom.MAX_SCALE;
                    }
                }
                if (curDiff < window[__givIN].prevDiff) {
                    // The distance between the two pointers has decreased
                    // console.log("Pinch moving IN -> Zoom out", ev);
                    window[__givIN].zoom.scale -= window[__givIN].zoom.SCALE_STEP;
                    if (window[__givIN].zoom.scale < 1) {
                        window[__givIN].zoom.scale = 1;
                    }
                }

                window[__givIN].zoom.scale = Math.round(window[__givIN].zoom.scale * 100) / 100;

                window[__givIN].calibrateZoomTran();
                window[__givIN].zoom.elContainer.style.transform =
                    'scale(' + window[__givIN].zoom.scale + ') translate( ' + window[__givIN].zoom.tranX + 'px, ' + window[__givIN].zoom.tranY + 'px )';
            }

            // Cache the distance for the next move event
            window[__givIN].prevDiff = curDiff;

            window[__givIN].zoom.gsLastClientX = e.clientX;
            window[__givIN].zoom.gsLastTime = new Date().getTime();

        } else {
            // window[__givIN].zoom.elContainer.classList.add('stop-tran');  // no animation

            if (window[__givIN].zoom.drag) {
                window[__givIN].zoom.tranX -= (window[__givIN].zoom.lastClientX - e.clientX);
                window[__givIN].zoom.tranY -= (window[__givIN].zoom.lastClientY - e.clientY);

                // console.log('single touch', new Date().getTime(),
                //     'diffXY', (window[__givIN].zoom.lastClientX - e.clientX), (window[__givIN].zoom.lastClientY - e.clientY),
                //     'lastClientXY', window[__givIN].zoom.lastClientX, window[__givIN].zoom.lastClientY,
                //     'clientXY', e.clientX, e.clientY,
                //     'tranXY', window[__givIN].zoom.tranX, window[__givIN].zoom.tranY
                // );

                window[__givIN].zoom.lastClientX = e.clientX;
                window[__givIN].zoom.lastClientY = e.clientY;

                window[__givIN].calibrateZoomTran();
                window[__givIN].zoom.elContainer.style.transform =
                    'scale(' + window[__givIN].zoom.scale + ') translate( ' + window[__givIN].zoom.tranX + 'px, ' + window[__givIN].zoom.tranY + 'px )';
            }
        }
    }

    removeEvent(e) {
        // Remove this event from the target's cache
        const index = window[__givIN].evCache.findIndex(
            (cachedEv) => cachedEv.pointerId === e.pointerId,
        );
        window[__givIN].evCache.splice(index, 1);
    }
    //  END : pinch event


    calibrateZoomTran() {
        let maxX = Math.floor(((window.innerWidth * this.zoom.scale) - window.innerWidth) / (this.zoom.scale * 2));
        let maxY = Math.floor(((window.innerHeight * this.zoom.scale) - window.innerHeight) / (this.zoom.scale * 2));

        if (maxX > 0) {
            maxX += (this.zoom.scale * 5);
        }
        if (maxY > 0) {
            maxY += (this.zoom.scale * 5);
        }

        if (this.zoom.tranX > maxX) {
            this.zoom.tranX = maxX;
        } else if (this.zoom.tranX < -(maxX)) {
            this.zoom.tranX = -(maxX);
        }

        if (this.zoom.tranY > maxY) {
            this.zoom.tranY = maxY;
        } else if (this.zoom.tranY < -(maxY)) {
            this.zoom.tranY = -(maxY);
        }
    }

    navPrev() {
        // checks playing slide and not first image
        if (!this.slide.play && this.selectIndex > 0) {
            this.selectImage(--this.selectIndex);
            if (this.zoom.view) {
                this.zoomImageReset();
            }
        }
    }
    navNext() {
        // checks playing slide and not last image
        if (!this.slide.play && this.selectIndex < (this.data.length - 1)) {
            this.selectImage(++this.selectIndex);
            if (this.zoom.view) {
                this.zoomImageReset();
            }
        }
    }

    download() {
        const msg = {
            msgType: 'download',
            data: this.selectIndex
        };
        window.postMessage(msg, '*');
    }

    export() {
        const msg = {
            msgType: 'export',
            data: this.selectIndex
        };
        window.postMessage(msg, '*');
    }

    toggleExif() {
        if (this._el.exif.classList.contains('on')) {
            this._el.exif.classList.remove('on');
            this._el.btnExif.classList.remove('on');
            this.#_setCookie('giViewerExif', 'false', 7);    // 7 day
        } else {
            this._el.exif.classList.add('on');
            this._el.btnExif.classList.add('on');
            this.#_setCookie('giViewerExif', 'true', 7);
        }
    }

    toggleZoomFullscreen() {
        if (this.fullscreenMode) {
            this.fullscreenMode = false;
            this._el.btnFullscreen.classList.remove('on');
            this.#_setCookie('giViewerFullscreen', 'false', 7);   // 7 day
        } else {
            this.fullscreenMode = true;
            this._el.btnFullscreen.classList.add('on');
            this.#_setCookie('giViewerFullscreen', 'true', 7);
        }
    }

    tooglePlay() {
        if (this.slide.play) {
            this.stopSlide();
        } else {
            this.#_playSlide();
        }
        this.#_checkButtonStatus();
    }

    playSlide() {

        if (this.slide.playOrder === 'F') {
            if (this.selectIndex < (this.data.length - 1)) {
                this.selectImage(++this.selectIndex);
            } else {
                this.selectImage(0);
            }
        } else if (this.slide.playOrder === 'R') {

            this.selectImage(Math.floor(Math.random() * this.data.length));

        } else if (this.slide.playOrder === 'B') {
            if (this.selectIndex > 0) {
                this.selectImage(--this.selectIndex);
            } else {
                this.selectImage(this.data.length - 1);
            }
        }
    }

    slideForward() {
        this.slide.playOrder = 'F';
        this.#_checkButtonStatus();
        this._el.bottomPannel.classList.remove('show');
    }
    slideRandom() {
        this.slide.playOrder = 'R';
        this.#_checkButtonStatus();
        this._el.bottomPannel.classList.remove('show');
    }
    slideBackward() {
        this.slide.playOrder = 'B';
        this.#_checkButtonStatus();
        this._el.bottomPannel.classList.remove('show');
    }
    slideThreshold(sec) {
        this.slide.threshold = (sec * 1000);
        this.#_setCookie('giViewerSlideThreshold', this.slide.threshold, 7);    // 7 day

        this.#_checkButtonStatus();
        this.#_playSlide();
    }
    toggleRightPanel() {
        if (this._el.bottomPannel.classList.contains('show')) {
            this._el.bottomPannel.classList.remove('show');
        } else {
            this._el.bottomPannel.classList.add('show');
        }
    }

    /********************
     * priviate methods
     *
     */
    #_playSlide() {

        this.slide.play = true;
        if (this.fullscreenMode) {
            if (document.fullscreenEnabled) {
                this._el.el.requestFullscreen().catch((err) => {
                    alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
                });
                this._el.currImg.classList.add('nozoom');
            } else {
                console.info('document.fullscreenEnabled is disabled');
            }
        }

        this._el.el.classList.add('playslide');
        this._el.bottomPannel.classList.remove('show');
        this.#_checkButtonStatus();

        this.#_clearSlideTimer();
        this.slide.timer = setInterval(() => {
            this.playSlide();
        }, this.slide.threshold);
    }

    stopSlide() {

        this.slide.play = false;
        this.#_clearSlideTimer();

        if (this.fullscreenMode && document.fullscreenElement) {
            document.exitFullscreen();
        }
        this._el.currImg.classList.remove('nozoom');

        this._el.el.classList.remove('playslide');
        this.#_checkButtonStatus();
    }

    #_clearSlideTimer() {
        if (this.slide.timer) {
            clearInterval(this.slide.timer);
        }
        this.slide.timer = null;
    }

    #_checkButtonStatus() {

        if (this.slide.play) {
            this._el.btnPrev.classList.add('disable');
            this._el.btnNext.classList.add('disable');

            const btns = this._el.el.querySelectorAll('.img-view .btn-rect');
            btns.forEach(el => { el.classList.remove('select') });

            if (this.slide.threshold < 10000) {
                this._el.btnThreshold5.classList.add('select');
            } else if (this.slide.threshold === 10000) {
                this._el.btnThreshold10.classList.add('select');
            } else if (this.slide.threshold === 15000) {
                this._el.btnThreshold15.classList.add('select');
            } else if (this.slide.threshold === 20000) {
                this._el.btnThreshold20.classList.add('select');
            } else if (this.slide.threshold === 30000) {
                this._el.btnThreshold30.classList.add('select');
            } else {
            }

            if (this.slide.playOrder === 'F') {
                this._el.btnForward.classList.add('select');
            } else if (this.slide.playOrder === 'R') {
                this._el.btnRandom.classList.add('select');
            } else if (this.slide.playOrder === 'B') {
                this._el.btnBackward.classList.add('select');
            }

        } else {

            if (this.selectIndex < 1) {
                this._el.btnPrev.classList.add('disable');
            } else {
                this._el.btnPrev.classList.remove('disable');
            }

            if (this.selectIndex > (this.data.length - 2)) {
                this._el.btnNext.classList.add('disable');
            } else {
                this._el.btnNext.classList.remove('disable');
            }

        }
    }

    #_setNav() {

        this.nav.el = document.querySelector('.img-nav');
        this.nav.elPrev = this.nav.el.querySelector('.navbtn-prev');
        this.nav.elNext = this.nav.el.querySelector('.navbtn-next');
        this.nav.elContainer = this.nav.el.querySelector('.imglist-container');
        this.nav.elImgList = this.nav.el.querySelector('.imglist');

        this.nav.elPrev.addEventListener('click', () => this.navPrevNav());
        this.nav.elNext.addEventListener('click', () => this.navNextNav());


        this.nav.imgListWidth = this.nav.TH_WIDTH * this.data.length;

        let h = '';
        for (let i = 0, l = this.data.length; i < l; i++) {
            const imgUrl = this.data[i].ImageRoot + '/th/' + this.data[i].FileName;
            h += '<li '
                + 'style="background-image:url(' + imgUrl + ')" '
                + 'onclick="' + __givIN + '.selectImage(' + i + ')" '
                + 'title="' + this.data[i].FileName + '" '
                + '></li>';
        }
        this.nav.elImgList.innerHTML = h;
        this.nav.elImgList.style.width = this.nav.imgListWidth + 'px';
        this.nav.elImgs = this.nav.elImgList.querySelectorAll('li');

        if (this.isMobile) {
            this.nav.elContainer.onpointerdown = this.__navPointerDownHandler;
            this.nav.elContainer.onpointerup = this.__navPointerUpHandler;
            this.nav.elContainer.onpointercancel = this.__navPointerUpHandler;
            this.nav.elContainer.onpointerout = this.__navPointerUpHandler;
            this.nav.elContainer.onpointerleave = this.__navPointerUpHandler;
        }

        this.__fixNav();
    }

    __fixNav() {
        if (this.nav.elContainer) {
            const ct_width = this.nav.elContainer.clientWidth;
            const il_width = this.nav.imgListWidth;
            // console.log('__fixNav', ct_width, il_width);

            if (ct_width > il_width) {
                this.nav.lesser = true;
                this.nav.tranX = Math.floor((ct_width - il_width) / 2);
                this.nav.elPrev.classList.add('disabled');
                this.nav.elNext.classList.add('disabled');
            } else {
                this.nav.lesser = false;
                this.nav.tranX = Math.floor((ct_width - this.nav.TH_WIDTH) / 2) - (this.selectIndex * this.nav.TH_WIDTH);
                if (this.nav.tranX > 0) {
                    this.nav.tranX = 0;
                }
                const maxRight = this.nav.elContainer.clientWidth - this.nav.imgListWidth;
                if (this.nav.tranX < maxRight) {
                    this.nav.tranX = maxRight;
                }
            }
            this.nav.elImgList.style.transform = 'translate( ' + this.nav.tranX + 'px )';

            // if (this.selectIndex != null) {
            this.nav.elImgs.forEach((el) => el.classList.remove('select'));
            this.nav.elImgs[this.selectIndex].classList.add('select');
            this.checkNavBtnStatus();
        }
    }

    navPrevNav() {
        if (this.nav.elContainer.clientWidth < this.nav.imgListWidth) {
            this.nav.tranX += (this.nav.elContainer.clientWidth - (this.nav.TH_WIDTH * (this.isMobile ? 0.4 : 2)));
            if (this.nav.tranX > 0) {
                this.nav.tranX = 0;
            }
            this.nav.elImgList.style.transform = 'translate( ' + this.nav.tranX + 'px )';
            this.checkNavBtnStatus();
        }
    }
    navNextNav() {
        if (this.nav.elContainer.clientWidth < this.nav.imgListWidth) {
            this.nav.tranX -= (this.nav.elContainer.clientWidth - (this.nav.TH_WIDTH * (this.isMobile ? 0.4 : 2)));
            const maxRight = this.nav.elContainer.clientWidth - this.nav.imgListWidth;
            if (this.nav.tranX < maxRight) {
                this.nav.tranX = maxRight;
            }
            this.nav.elImgList.style.transform = 'translate( ' + this.nav.tranX + 'px )';
            this.checkNavBtnStatus();
        }
    }
    checkNavBtnStatus() {
        if (!this.nav.lesser) {
            if (this.nav.tranX === 0) {
                this.nav.elPrev.classList.add('disabled');
            } else {
                this.nav.elPrev.classList.remove('disabled');
            }
            const maxRight = this.nav.elContainer.clientWidth - this.nav.imgListWidth;
            if (this.nav.tranX === maxRight) {
                this.nav.elNext.classList.add('disabled');
            } else {
                this.nav.elNext.classList.remove('disabled');
            }
        }
    }
    // img container 'pointdown'
    __navPointerDownHandler(e) {
        window[__givIN].nav.drag = true;
        window[__givIN].nav.lastClientX = e.clientX;
        e.preventDefault();
    }
    // img container 'pointup'
    __navPointerUpHandler(e) {
        if (window[__givIN].nav.elContainer.clientWidth < window[__givIN].nav.imgListWidth) {

            if (window[__givIN].nav.drag) {
                const diff = window[__givIN].nav.lastClientX - e.clientX;

                window[__givIN].nav.tranX -= diff;

                if (window[__givIN].nav.tranX > 0) {
                    window[__givIN].nav.tranX = 0;
                }
                const maxRight = window[__givIN].nav.elContainer.clientWidth - window[__givIN].nav.imgListWidth;
                if (window[__givIN].nav.tranX < maxRight) {
                    window[__givIN].nav.tranX = maxRight;
                }

                window[__givIN].nav.elImgList.style.transform = 'translate( ' + window[__givIN].nav.tranX + 'px )';

                window[__givIN].checkNavBtnStatus();
            }
            window[__givIN].ctGs.drag = false;
            e.preventDefault();
        }
    }


    #_getHTMLExif(d) {
        return '<div class="filename">' + d.FileName + '</div>'
            + '<ul>'
            + (d.KeyWord ? '<li><span class="label">KeyWord</span> : ' + d.KeyWord + '</li>' : '')
            // + '<li><span class="label">Exif Version</span> : ' + d.ExifVersion + '</li>'
            + '<li><span class="label">DateTime</span> : ' + d.DateTime + '</li>'
            // + '<li><span class="label">ExifImageWidth</span> : ' + d.ExifImageWidth + '</li>'
            // + '<li><span class="label">ExifImageLength</span> : ' + d.ExifImageLength + '</li>'
            // + '<li><span class="label">Make</span> : ' + d.Make + '</li>'
            + '<li><span class="label">Model</span> : ' + d.Model + '</li>'
            // + '<li><span class="label">WhiteBalance</span> : ' + d.WhiteBalance + '</li>'
            + '<li><span class="label">ISOSpeedRatings</span> : ' + d.ISOSpeedRatings + '</li>'
            + '<li><span class="label">FocalLength</span> : ' + d.FocalLength + '</li>'
            + '<li><span class="label">ApertureFNumber</span> : ' + d.ApertureFNumber + '</li>'
            + '<li><span class="label">ExposureTime</span> : ' + d.ExposureTime + '</li>'
            + '<li><span class="label">FNumber</span> : ' + d.FNumber + '</li>'
            + (d.Artist ? '<li><span class="label">Artist</span> : ' + d.Artist + '</li>' : '')
            // + (d.Copyright ? '<li><span class="label">Copyright</span> : ' + d.Copyright + '</li>' : '')
            + (d.LensMake ? '<li><span class="label">LensMake</span> : ' + d.LensMake + '</li>' : '')
            + (d.LensModel ? '<li><span class="label">LensModel</span> : ' + d.LensModel + '</li>' : '')
            // + (d.LensSerialNumber ? '<li><span class="label">LensSerialNumber</span> : ' + d.LensSerialNumber + '</li>' : '')
            + '</ul>';
    }

    #_setCookie(name, value, exp) {
        const date = new Date();
        date.setTime(date.getTime() + exp * 24 * 60 * 60 * 1000);
        document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
    }
    #_getCookie(name) {
        const value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return value ? unescape(value[2]) : null;
    }
}
