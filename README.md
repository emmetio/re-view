# Emmet Re:View

Emmet Re:View is a small Google Chrome extension that finds responsive design breakpoints on your page and creates view for each breakpoint.

## Features

* Preview all responsive design breakpoints on a single page.
* Sync scrolling.
* Automatic viewport scaling for large views.
* Manual viewport scaling for fine-tuning previews.
* Online sharing of previews: show your colleagues and clients how your web-site * looks on different viewport widths.

See [Emmet Re:View](http://re-view.emmet.io) web-site for more info.

## Troubleshooting

#### I see blank boxes instead of previews on my web-site

This may happen if you explicitly forbid your web-site to be displayed in iframes with `X-Frame-Options` meta tag or HTTP header. The only workaround right now is to remove this option. Future versions of Re:View extension may may automatically remove this option.

#### Sync scrolling is not working in online preview

This happens due to browser security restrictions (same-origin policy). Currently, there’s no workaround for this issue.

## Building

Re:View uses [Gulp](http://gulpjs.com) for building. Simply clone this repo and run

```
npm install
./node_modules/.bin/gulp
--- or ---
gulp
```