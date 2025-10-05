/* https://codepen.io/mikel301292/pen/dMYRYZ */
document.addEventListener('DOMContentLoaded', function () {
    var height = window.innerHeight,
        x = 0, y = height / 2,
        curveX = 10,
        curveY = 0,
        targetX = 0,
        xitteration = 0,
        yitteration = 0,
        menuExpanded = false;

    var blob = document.getElementById('blob'),
        blobPath = document.getElementById('blob-path'),
        hamburger = document.querySelector('.hamburger');

    document.addEventListener('mousemove', function (e) {
        x = e.pageX;
        y = e.pageY;
    });

    function handleMouseEnter() {
        this.parentNode.classList.add('expanded');
        menuExpanded = true;
    }

    function handleMouseLeave() {
        menuExpanded = false;
        this.parentNode.classList.remove('expanded');
    }

    hamburger.addEventListener('mouseenter', handleMouseEnter);
    document.querySelector('.menu-inner').addEventListener('mouseenter', handleMouseEnter);
    
    document.querySelector('.menu-inner').addEventListener('mouseleave', handleMouseLeave);

    function easeOutExpo(currentIteration, startValue, changeInValue, totalIterations) {
        return changeInValue * (-Math.pow(2, -10 * currentIteration / totalIterations) + 1) + startValue;
    }

    var hoverZone = 150;
    var expandAmount = 20;

    function svgCurve() {
        if ((curveX > x - 1) && (curveX < x + 1)) {
            xitteration = 0;
        } else {
            if (menuExpanded) {
                targetX = 0;
            } else {
                xitteration = 0;
                if (x > hoverZone) {
                    targetX = 0;
                } else {
                    targetX = -(((60 + expandAmount) / 100) * (x - hoverZone));
                }
            }
            xitteration++;
        }

        if ((curveY > y - 1) && (curveY < y + 1)) {
            yitteration = 0;
        } else {
            yitteration = 0;
            yitteration++;
        }

        curveX = easeOutExpo(xitteration, curveX, targetX - curveX, 100);
        curveY = easeOutExpo(yitteration, curveY, y - curveY, 100);
		
		curveX = Math.min(curveX, 40);
		curveY = Math.min(curveY, height);

        var anchorDistance = 200;
        var curviness = anchorDistance - 40;
		
		var newCurve2 = "M60," + height + "H0V0h60v" + (curveY - anchorDistance) + "c0," + curviness + "," + curveX + "," + curviness + "," + curveX + "," + anchorDistance + "S60," + (curveY) + ",60," + (curveY + (anchorDistance * 2)) + "V" + height + "z";

        blobPath.setAttribute('d', newCurve2);

        blob.style.width = curveX + 60 + 'px';

        hamburger.style.transform = 'translate(' + curveX + 'px, ' + curveY + 'px)';

        window.requestAnimationFrame(svgCurve);
    }

    window.requestAnimationFrame(svgCurve);

});