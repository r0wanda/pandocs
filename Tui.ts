import bl from 'blessed';
import figlet from 'figlet';
import strip from 'striptags';
import invert from 'invert-color';
import { decode } from 'html-entities';
import ApiOpt from './ApiOpt.js';

interface Boxes {
    [key: string]: any;
    splash?: bl.Widgets.BoxElement;
    splashText?: bl.Widgets.TextElement;
    bar?: bl.Widgets.BoxElement;
    dur?: bl.Widgets.BoxElement;
}

class Tui extends ApiOpt {
    scr;
    boxes: Boxes;
    constructor() {
        super();
        this.mplay.on('status', this.update.bind(this));
        this.mplay.on('time', this.dur.bind(this));
        this.scr = bl.screen({
            smartCSR: true,
            fullUnicode: true
        });
        this.boxes = {};
        this.scr.title = 'Pandora';
        this.scr.key(['escape', 'C-c'], () => process.exit(0));
        this.scr.key(['C-r'], () => this.scr.render());
        this.boxes.splash = bl.box({
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            style: {
                fg: 'white',
                bg: 'blue'
            }
        });
        this.boxes.splashText = bl.text({
            top: 'center',
            left: 'center',
            width: 'shrink',
            height: 'shrink',
            content: figlet.textSync('Pandora', {
                font: 'ANSI Shadow',
            }),
            style: {
                fg: 'black',
                bg: 'blue'
            }
        });
        this.boxes.splash.append(this.boxes.splashText);
        this.scr.append(this.boxes.splash);
        this.boxes.splash.focus();
        this.scr.render();
    }
    /**
     * Set the fg and bg for a list of boxes
     * @param boxes Box keys
     */
    fgBg(...boxes: Array<string>): void {
        const col = this.getColor();
        for (var box of boxes) {
            if (this.boxes[box] && this.boxes[box].style.fg && this.boxes[box].style.bg) {
                this.boxes[box].style.bg = col;
                this.boxes[box].style.fg = invert(col, true);
            }
        }
    }
    update() {
        this.fgBg('box', 'dur');
        this.boxes.bar?.setContent(this.getSong());
        this.scr.render();
    }
    prettySec(dur: number): string {
        const min = Math.floor(dur / 60);
        const sec = Math.floor(dur % 60);
        return `${min}:${('0' + sec).slice(-2)}`;
    }
    dur(sec: number) {
        this.boxes.dur?.setContent(this.prettySec(sec));
        this.scr.render();
    }
    async source() {
        var src = super.source.bind(this);
        var res: Awaited<ReturnType<typeof src>>;
        try {
            res = await super.source();
        } catch (err) {
            console.error(err);
            try {
                res = await this.retry(super.source.bind(this));
            } catch (err) {
                console.error(err);
                console.log(err);
                process.exit(1);
            }
        }
        if (!res) throw new Error('Could not connect to Pandora!');
        return res;
    }
    initBar() {
        var col = this.getColor();
        this.boxes.bar = bl.box({
            top: '100%-1',
            left: 'center',
            width: '100%',
            height: 1,
            content: 'Buffering',
            tags: true,
            style: {
                bg: col,
                fg: invert(col, true)
            }
        });
        this.boxes.dur = bl.box({
            top: '100%-1',
            left: '100%-9',
            width: 'shrink',
            height: 1,
            align: 'right',
            content: '',
            tags: true,
            style: {
                bg: col,
                fg: invert(col, true)
            }
        });
        this.scr.append(this.boxes.bar);
        this.scr.append(this.boxes.dur);
        this.boxes.bar.focus();
        this.scr.render();
    }
    async init() {
        await super.init();
        await this.source()
        this.boxes.splash?.destroy();
        this.scr.render();
        this.initBar();
    }
}

export default Tui;