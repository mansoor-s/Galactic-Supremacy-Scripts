var SimplexNoise = require('./lib/SimplexNoise.js');

function createStars() {
    //scale of the galaxy
    var spiralTransformations = {
        x: .25,//675,
        y: .25
    };

    var zRandomOffsetRange = 300;
    var starsPerArm = 33333;
    var randomOffsetRange = 500;
    var A = 6000;
    var angleIncrament = .005;

     // "scale. higher = more zoomed in" 
    var xTransform = spiralTransformations.x || .6; 
    var yTransform = spiralTransformations.y || .6;
    
    var spirals = [
        {
            xDirection: 1,
            yDirection: 1,
            xAngle: 0,
            yAngle: 0
        },
        {
            xDirection: 1,
            yDirection: 1,
            xAngle: 90,
            yAngle: 90
        },
        {
            xDirection: 1,
            yDirection: 1,
            xAngle: 45,
            yAngle: 45
        }
    ];
    
    
    var stars = [];
    
    var spiralOdd = true;
    var noise = new SimplexNoise();
    for (var i = 0; i < spirals.length; i++) {
        var a = A;
        var spiral = spirals[i];
        
        var xAngle = spiral.xAngle >>> 0;
        var yAngle = spiral.yAngle >>> 0;
        
        //s = distance from teh last star  on the spiral curve
        var s = 500;
        var odd = true;
        for (var j = 0; j < starsPerArm; j++) {
            //angle incrament
            a += angleIncrament;
            //var noiseFactor = noise.noise(j, a)
            //a += noiseFactor * 5;
            var t = f_inv(a, s);
            var x = calc_x(a, t, xTransform);
            var y = calc_y(a, t, yTransform);
                
            var yTemp = rotateY(x, y, yAngle);
            x = rotateX(x, y, xAngle);
            y = yTemp;
                
            if (spiralOdd) {
                y = -y;
                spiralOdd = false
            } else {
                x = -x;
                spiralOdd = true;
            }
                
            var z = middleBiasedRand(zRandomOffsetRange);
            x += middleBiasedRand(randomOffsetRange);
            y += middleBiasedRand(randomOffsetRange);

            var NoiseFactor3d = noise.noise3d(x / 1000, y / 1000, z / 1000) * 80;
            x += NoiseFactor3d;
            y += NoiseFactor3d;
            z += NoiseFactor3d;
            
            stars.push({
                x: x,
                y: y,
                z: z,
                name: 'GS' + x + y + z,
                type: starType()
            });
                
            s += .5;
        }
        
    }
    
    return stars;
}

function starType() {
    //number between 0 and 9, inclusive
    return Math.floor(Math.random() * 10);
}


/*    
    x(t) = a t cos(t)
    y(t) = a t sin(t)
*/
function calc_x(a, t, z) {
    var x = a * z * t * Math.cos(t);
    return x;
}


function calc_y(a, t, z) {
    var y = a * z * t * Math.sin(t);
    return y;
}

function find_center() {
    var top = $elem.height() / 2 ;
    var left = $elem.width() / 2;
    var center = {
        top: 0, 
        left: 0
    };

    return center;
}


function arch_length(a, t) {
    //s(t) = 1/2 a (sqrt(t^2+1) t+sinh^(-1)(t))
    return .5 * a * Math.sqrt(Math.pow(t,2) + 1) * t + arsinh(t);
}

function sinh(arg) {
    return (Math.exp(arg) - Math.exp(-arg)) / 2;
}

function arsinh(arg) {
    //sinh^(-1)(x) = log(x+sqrt(1+x^2))
    return Math.log(arg + Math.sqrt(Math.pow(arg, 2) + 1));
}


function df(a, t) {
    return a * Math.sqrt(t*t + 1.0);
}


function f_inv(a, s) {
    var eps = 1.0e-10;
    var t = 0.0;
    while(true) {
        t = t - (arch_length(a, t) - s) / df(a, t);
        if ((Math.abs(arch_length(a, t) - s)) < eps) {
            return t;
        }
    }
}


function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function middleBiasedRand(maxOffset, biasFactor) {
    var biasFactor = biasFactor || 1.5;
    var sudoRand = Math.round(Math.random());
    var rand;
    if (sudoRand === 1) {
        rand =  -1 * Math.pow(Math.random(), biasFactor) * maxOffset;
    } else {
        rand = Math.pow(Math.random(), biasFactor) * maxOffset;
    }
    
    return rand;
}

function lowerBiasedRand(maxOffset, biasFactor) {
    var biasFactor = biasFactor || 1.5;
    var rand = Math.pow(Math.random(), biasFactor) * maxOffset;
    return rand;
}

function rotateX(x, y, angle) {
    //X = x * cos(angle) - y * sin(angle)
    return x * Math.cos(angle) - y * Math.sin(angle);
}

function rotateY(x, y, angle) {
    //Y = y * cos(angle) + x * sin(angle)
    return y * Math.cos(angle) + x * Math.sin(angle);
}


//we want planet type because gas giants get more moons
function createMoons(planetType) {
    //each type only has one texture
    var moonTypes = [
        'volcanic',
        'ice',
        'barren',
        'terran'
    ];


    var moons = [];
    var moonCount;
    
    if(planetType === 'gas') {
        moonCount = Math.round(rand(3, 6));
    } else if (planetType === 'terran') {
        moonCount = Math.round(rand(1, 2));
    } else {
        moonCount = Math.round(rand(0, 2));
    }

    for (var i = 0; i < moonCount; ++i) {
        var moon = {};
        moon.type = Math.round(rand(0, 3));
        moon.distance = i * 100;
        moon.orbit = Math.round((rand(0, 1) * 100)) / 100;
        moons.push(moon);
    }
}

function createSystem(star) {
    var system = {
        star: {},
        planets: [],
        astroidBelts: []
    };
    /*
        There are ATLEAST 4 planets in each star system.
        So when assigning a planet to the first player in the system, 
        make sure to assign one of the first 4 as the home planet
    */
    
    
    var planetTypes = [
        'gas',
        'ice',
        'terran',
        'volcanic',
        'barren'
    ];

    var planetMaps = [
        'gas0',
        'gas1',
        'gas2',
        'terran0',
        'terran1',
        'terran2',
        'volcanic0',
        'volcanic1',
        'volcanic2',
        'barren0',
        'barren1',
        'barren2',
        'ice0',
        'ice1',
        'ice2'
    ];

    var orbitalDistance = [
        350,
        3500,
        2500,
        600,
        1500,
        4200,
        1950,
        4700,
        5200,
        6200,
        7500,
        8880,
    ];

    var planetNum = (lowerBiasedRand(7, 1) + 4) >> 0;
    //for each planet..
    for (var k = 0; k < planetNum; ++k) {
        //each planet gets a random type.. between 0 and 4
        var planet = {};
        planet.type = (rand(0, 5) >> 0);
        planet.map = planetMaps.indexOf(planetTypes[planet.type] + (rand(0, 3) >> 0));

        //size
        if (planetTypes.indexOf('gas')) {
            size = rand(400, 650) >> 0;
        } else {
            planet.size = rand(150, 330) >> 0; 
        }

        //orbit
        planet.orbit = Math.round((rand(0, 1) * 100)) / 100;

        planet.distance = orbitalDistance[k];

        planet.moons = createMoons(planetTypes[planet.type]);

        planet.name = star.name + '-' + k

        system.planets.push(planet);
    }

    system.x = star.x;
    system.y = star.y;
    system.z = star.z;

    delete star.x;
    delete star.y;
    delete star.z;

    return system;
};


function generateMap() {
    var stars = createStars();
    var systems = [];
    for(var i = 0, len = stars.length; i < len; ++i) {

        var system = createSystem(stars[i]);
        systems.push(system);
    }
    return systems;

    //todo: nebulae generator
};

//for (var k = 0; k < 50; ++k) {
    
//}
module.exports.generateMap = generateMap;