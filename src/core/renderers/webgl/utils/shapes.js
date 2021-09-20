export function drawColor(context, iconIndex, color) {
    const row = Math.floor(iconIndex / 16.0);
    const column = iconIndex - row * 16;

    const centerX = column * 128 + 64;
    const centerY = row * 128 + 64;
    const radius = 64;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = color;
    context.fill();
}

export function drawFont(context, iconIndex, content) {
    const row = Math.floor(iconIndex / 16.0);
    const column = iconIndex - row * 16;

    const left = column * 128 + 64;
    const top = row * 128 + 96;

    context.font = '900 96px "Font Awesome 5 Free"';
    context.fillStyle = "black";
    context.textAlign = "center";
    context.verticalAlign = "middle";
    context.fillText(content, left, top);
}