/*-------------------------------------------------------------------------
태양계 애니메이션 Sun, Earth, Moon
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let axesVAO;
let cubeVAO;

let Sun_degree_ja = 0;           // 태양 자전
let Earth_degree_gong = 0;  // 지구 공전
let Earth_degree_ja = 0;     // 지구 자전
let Moon_degree_gong = 0;   // 달 공전
let Moon_degree_ja = 0;      // 달 자전

let lastTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);

    return true;
}

function setupAxesBuffers(shader) {
    axesVAO = gl.createVertexArray();
    gl.bindVertexArray(axesVAO);

    const axesVertices = new Float32Array([
        -1.0, 0.0, 1.0, 0.0,  // x축
        0.0, -1.0, 0.0, 1.0  // y축
    ]);

    const axesColors = new Float32Array([
        1.0, 0.3, 0.0, 1.0, 1.0, 0.3, 0.0, 1.0,  // x축 색상
        0.0, 1.0, 0.5, 1.0, 0.0, 1.0, 0.5, 1.0   // y축 색상
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function setupCubeBuffers(shader) {
    const cubeVertices = new Float32Array([
        -0.5,  0.5, 0.0,  
        -0.5, -0.5, 0.0,  
         0.5, -0.5, 0.0,  
         0.5,  0.5, 0.0   
    ]); // 기본 edge 1.0으로 바꿈, vec3됨

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    // uniform var로 u_color 했음
    /**
    const cubeColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,  // 빨간색
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);
    */

    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 3, gl.FLOAT, false, 0, 0);

    /**
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);
    */

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}



function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();

    // axes
    shader.setMat4("u_model", mat4.create());
    gl.bindVertexArray(axesVAO);

    shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]);
    gl.drawArrays(gl.LINES, 0, 2);
    shader.setVec4("u_color", [0.0, 1.0, 0.0, 1.0]);
    gl.drawArrays(gl.LINES, 2, 2);

    // sun
    let Sun_matrix = mat4.create();
    mat4.rotate(Sun_matrix, Sun_matrix, Sun_degree_ja, [0, 0, 1]);
    mat4.scale(Sun_matrix, Sun_matrix, [0.2, 0.2, 1.0]);

    shader.setMat4("u_model", Sun_matrix);
    shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // earth
    let Earth_matrix = mat4.create();
    mat4.rotate(Earth_matrix, Earth_matrix, Earth_degree_gong, [0, 0, 1]);
    mat4.translate(Earth_matrix, Earth_matrix, [0.7, 0.0, 0.0]);

    mat4.rotate(Earth_matrix, Earth_matrix, Earth_degree_ja, [0, 0, 1]);
    mat4.scale(Earth_matrix, Earth_matrix, [0.1, 0.1, 1.0]);

    shader.setMat4("u_model", Earth_matrix);
    shader.setVec4("u_color", [0.0, 1.0, 1.0, 1.0]);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    // moon
    let Moon_matrix = mat4.create();
    
    mat4.rotate(Moon_matrix, Moon_matrix, Earth_degree_gong, [0, 0, 1]);
    mat4.translate(Moon_matrix, Moon_matrix, [0.7, 0.0, 0.0]);
    
    mat4.rotate(Moon_matrix, Moon_matrix, Moon_degree_gong, [0, 0, 1]);
    mat4.translate(Moon_matrix, Moon_matrix, [0.2, 0.0, 0.0]);
    
    mat4.rotate(Moon_matrix, Moon_matrix, Moon_degree_ja, [0, 0, 1]);
    mat4.scale(Moon_matrix, Moon_matrix, [0.05, 0.05, 1.0]);
    
    shader.setMat4("u_model", Moon_matrix);
    shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;


    // update degree
    Sun_degree_ja += (Math.PI / 4) * deltaTime;          // 초당 45도
    Earth_degree_gong += (Math.PI / 6) * deltaTime;   // 30
    Earth_degree_ja += Math.PI * deltaTime;            // 180
    Moon_degree_gong += (2 * Math.PI) * deltaTime;      // 360
    Moon_degree_ja += Math.PI * deltaTime;             // 180


    render();
    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        shader = await initShader();
        
        setupCubeBuffers(shader);
        setupAxesBuffers(shader);
        shader.use();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
