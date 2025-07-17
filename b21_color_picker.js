"use strict"

class B21Picker {
    constructor() {
        const p = this;
        // Get the element references
        p.wheel_el = document.getElementById("wheel");
        p.wheel_chooser_el = document.getElementById("wheel_chooser");
        p.color_box_el = document.getElementById("clipboard_color_box");
        p.rgb_value_el = document.getElementById("clipboard_rgb_value");
        p.hex_value_el = document.getElementById("clipboard_hex_value");
        p.brightness_slider_el = document.getElementById("brightness_slider");
        p.brightness_chooser_el = document.getElementById("brightness_chooser");
        
        // Color wheel canvas context
        p.ctx = p.wheel_el.getContext('2d', { willReadFrequently: true });
        
        p.wheel_width_px = p.wheel_el.offsetWidth;
        p.wheel_height_px = p.wheel_el.offsetHeight;
        p.wheel_chooser_width_px = p.wheel_chooser_el.offsetWidth;
        p.wheel_chooser_height_px = p.wheel_chooser_el.offsetHeight;
        
        // Capture mouse events for color wheel
        p.wheel_el.addEventListener("mousedown", (e) => { p.wheel_mousedown(e); });
        p.wheel_el.addEventListener("mouseup", (e) => { p.wheel_mouseup(e); });
        p.wheel_el.addEventListener("mousemove", (e) => { p.wheel_mousemove(e); });
        //p.wheel_el.addEventListener("mouseout", (e) => { p.mouseup(e); });
        p.wheel_drag = false;
        
        // Capture mouse events for brightness chooser
        p.brightness_slider_el.addEventListener("mousedown", (e) => { p.brightness_mousedown(e); });
        p.brightness_slider_el.addEventListener("mouseup", (e) => { p.brightness_mouseup(e); });
        p.brightness_slider_el.addEventListener("mousemove", (e) => { p.brightness_mousemove(e); });
        p.brightness_slider_el.addEventListener("mouseout", (e) => { p.brightness_mouseout(e); });
        //p.wheel_el.addEventListener("mouseout", (e) => { p.mouseup(e); });
        p.brightness_drag = false;
        
        p.draw_color_wheel();
    }
    
    wheel_mousedown(e) {
        const p = this;
        //console.log(`mousedown at ${e.offsetX.toFixed(0)},${e.offsetY.toFixed(0)}`);
        p.wheel_drag = true;
        p.wheel_mousemove(e);
    }
    
    wheel_mouseup(e) {
        const p = this;
        //console.log(`mouseup at ${e.offsetX.toFixed(0)},${e.offsetY.toFixed(0)}`);
        p.wheel_drag = false;
    }
    
    wheel_mousemove(e) {
        const p = this;
        //console.log(`mousemove at ${e.offsetX.toFixed(0)},${e.offsetY.toFixed(0)}`);
        e.preventDefault();
        const x = e.offsetX/p.wheel_width_px;
        const y = e.offsetY/p.wheel_height_px;
        const d = Math.sqrt(Math.pow(x-0.5,2)+Math.pow(y-0.5,2));
        if (p.wheel_drag && d < 0.495) {
            console.log(`mouse ${e.offsetX},${e.offsetY}`);
            const px_colors = p.ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
            p.update_rgb({r: px_colors[0], g: px_colors[1], b: px_colors[2]});
        }
    }
    
    brightness_mousedown(e) {
        const p = this;
        console.log(`brightness down at ${e.offsetX},${e.offsetY}`);
        p.brightness_drag = true;
        p.brightness_mousemove(e);
    }
    
    brightness_mouseup(e) {
        const p = this;
        console.log("brightness up");
        p.brightness_drag = false;
    }
    
    brightness_mouseout(e) {
        const p = this;
        console.log("brightness out");
        //p.brightness_drag = false;
    }
    
    brightness_mousemove(e) {
        const p = this;
        console.log("brightness move");
        let slider_ratio = e.offsetX / p.brightness_slider_el.clientWidth;
        let x_ratio = Math.max(0, Math.min(1, (slider_ratio - 0.1) / 0.8));
        if (p.brightness_drag && slider_ratio > 0.1 && slider_ratio < 0.9) {
            console.log("x_ratio", x_ratio);
            p.brightness_chooser_el.style.left = (8 + x_ratio * 79).toFixed(1) + "%";
        }
    }
    
    update_rgb(rgb) {
        const p = this;
        let xy = p.rgb2xy(rgb);
        let x_px = xy[0] * p.wheel_width_px;
        let y_px = xy[1] * p.wheel_height_px;
        console.log(`r=${rgb.r},g=${rgb.g},b=${rgb.b} at ${x_px.toFixed(0)},${y_px.toFixed(0)}`);
        p.set_wheel_chooser(x_px, y_px);
        p.set_color_box(rgb);
        p.set_rgb_text(rgb);
        p.set_hex_text(rgb);
    }
    
    set_wheel_chooser(x_px, y_px) {
        const p = this;
        const draw_x = x_px - p.wheel_chooser_width_px / 2;
        const draw_y = y_px - p.wheel_chooser_height_px / 2;
        p.wheel_chooser_el.style.left = `${draw_x.toFixed(1)}px`;
        p.wheel_chooser_el.style.top = `${draw_y.toFixed(1)}px`;
    }
    
    set_color_box(rgb) {
        const p = this;
        const css_color = `rgb(${rgb.r.toFixed(0)},${rgb.g.toFixed(0)},${rgb.b.toFixed(0)})`;
        p.color_box_el.style.backgroundColor = css_color;
    }
    
    set_rgb_text(rgb) {
        const p = this;
        const css_color = `rgb(${rgb.r.toFixed(0)},${rgb.g.toFixed(0)},${rgb.b.toFixed(0)})`;
        p.rgb_value_el.innerText = css_color;
    }
    
    set_hex_text(rgb) {
        const p = this;
        let hex_str = "#";
        hex_str += ("0"+Math.round(rgb.r).toString(16).toUpperCase()).slice(-2);
        hex_str += ("0"+Math.round(rgb.g).toString(16).toUpperCase()).slice(-2);
        hex_str += ("0"+Math.round(rgb.b).toString(16).toUpperCase()).slice(-2);
        p.hex_value_el.innerText = hex_str;
    }
    
    draw_color_wheel() {
        const p = this;
        let radius = 256;
        let image = p.ctx.createImageData(2*radius, 2*radius);
        let data = image.data;
    
        for (let x = -radius; x < radius; x++) {
            for (let y = -radius; y < radius; y++) {
                
                let [r, phi] = p.xy2polar(x, y);
                
                if (r > radius) {
                    // skip all (x,y) coordinates that are outside of the circle
                    continue;
                }
                
                let deg = p.rad2deg(phi);
                
                // Figure out the starting index of this pixel in the image data array.
                let rowLength = 2*radius;
                let adjustedX = x + radius; // convert x from [-50, 50] to [0, 100] (the coordinates of the image data array)
                let adjustedY = y + radius; // convert y from [-50, 50] to [0, 100] (the coordinates of the image data array)
                let pixelWidth = 4; // each pixel requires 4 slots in the data array
                let index = (adjustedX + (adjustedY * rowLength)) * pixelWidth;
                
                let hue = deg;
                let saturation = r / radius;
                let value = 1.0;
                
                let rgb = p.hsv2rgb({ h:hue, s:saturation, v:value });
                let alpha = 255;
                
                data[index] = Math.round(rgb.r);
                data[index+1] = Math.round(rgb.g);
                data[index+2] = Math.round(rgb.b);
                data[index+3] = alpha;
            }
        }
        p.ctx.putImageData(image, 0, 0);
    }
    
    // [x,y] are 0..1 for proportion of width/height
    rgb2xy(rgb) {
        const p = this;
        let hsv = p.rgb2hsv(rgb);
        return p.polar2xy(hsv.h,hsv.s);
    }
    
    // [x,y] are 0..1 for proportion of width/height
    xy2polar(x,y) {
        let r = Math.sqrt(x*x + y*y);
        let phi = Math.atan2(y, x);
        return [r, phi];
    }
    
    // 0 deg = west, r = 0..1 proportion of wheel radius
    // [x,y] 0..1 proportion of wheel width, height
    polar2xy(deg, r) {
        const p = this;
        let x = 0.5 - r * Math.cos(p.deg2rad(deg)) / 2;
        let y = 0.5 - r * Math.sin(p.deg2rad(deg)) / 2;
        return [x,y];
    }
    
    // rad in [-π, π] range
    // return degree in [0, 360] range
    rad2deg(rad) {
        return ((rad + Math.PI) / (2 * Math.PI)) * 360;
    }
    
    deg2rad(deg) {
        return deg / 360 * 2 * Math.PI;
    }
    
    // hue in range [0, 360]
    // saturation, value in range [0,1]
    // return [r,g,b] each in range [0,255]
    // See: https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
    hsv2rgb(hsv) {
        let chroma = hsv.v * hsv.s;
        let hue1 = hsv.h / 60;
        let x = chroma * (1- Math.abs((hue1 % 2) - 1));
        let r1, g1, b1;
        if (hue1 >= 0 && hue1 <= 1) {
            ([r1, g1, b1] = [chroma, x, 0]);
        } else if (hue1 >= 1 && hue1 <= 2) {
            ([r1, g1, b1] = [x, chroma, 0]);
        } else if (hue1 >= 2 && hue1 <= 3) {
            ([r1, g1, b1] = [0, chroma, x]);
        } else if (hue1 >= 3 && hue1 <= 4) {
            ([r1, g1, b1] = [0, x, chroma]);
        } else if (hue1 >= 4 && hue1 <= 5) {
            ([r1, g1, b1] = [x, 0, chroma]);
        } else if (hue1 >= 5 && hue1 <= 6) {
            ([r1, g1, b1] = [chroma, 0, x]);
        }
        
        let m = hsv.v - chroma;
        let [r,g,b] = [r1+m, g1+m, b1+m];
        
        // Change r,g,b values from [0,1] to [0,255]
        return { r: 255*r, g: 255*g, b: 255*b };
    }
    
    // {r:,g:,b:} 0..255
    // {h:,s:,v:} hue 0..360, saturation,value 0..1
    rgb2hsv(rgb) {
        let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
        rabs = rgb.r / 255;
        gabs = rgb.g / 255;
        babs = rgb.b / 255;
        v = Math.max(rabs, gabs, babs),
        diff = v - Math.min(rabs, gabs, babs);
        diffc = c => (v - c) / 6 / diff + 1 / 2;
        if (diff == 0) {
            h = s = 0;
        } else {
            s = diff / v;
            rr = diffc(rabs);
            gg = diffc(gabs);
            bb = diffc(babs);
    
            if (rabs === v) {
                h = bb - gg;
            } else if (gabs === v) {
                h = (1 / 3) + rr - bb;
            } else if (babs === v) {
                h = (2 / 3) + gg - rr;
            }
            if (h < 0) {
                h += 1;
            }else if (h > 1) {
                h -= 1;
            }
        }
        return {
            h: h*360,
            s: s,
            v: v
        };
    }
    
} // end B21Picker
            