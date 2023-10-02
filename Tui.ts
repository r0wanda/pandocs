import bl from 'blessed';
import figlet from 'figlet';
import Api from './Api.js';

interface Boxes {
    splash?: bl.Widgets.BoxElement;
    splashText?: bl.Widgets.TextElement;
    bar?: bl.Widgets.BoxElement;
}

class Tui extends Api {
    scr;
    boxes: Boxes;
    constructor() {
        super();
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
    async source() {
        var res;
        try {
            res = await super.source();
        } catch (err) {
            console.error(err);
            try {
                await new Promise<void>(r => {
                    var tries = 0;
                    const int = setInterval(async () => {
                        try {
                            res = await super.source();
                            clearInterval(int);
                            r();
                        } catch (err) {
                            console.error(err);
                            tries++;
                        }
                        if (tries >= 10) throw new Error('Could not connect to Pandora!');
                    }, 3000);
                })
            } catch (err) {
                console.error(err);
                console.log(err);
                process.exit(1);
            }
        }
        if (!res) throw new Error('Could not connect to Pandora!');
        return res;
    }
    async init() {
        await super.init();
        await this.source()
        this.boxes.splash?.destroy();
        this.scr.render();
    }
}

export default Tui;