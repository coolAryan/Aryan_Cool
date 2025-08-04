// Mobile Touch Test Script for Breakout Game
// This script can be pasted into browser console to test touch functionality

console.log('🎮 Starting Mobile Touch Test for Breakout Game...');

// Test configuration
const testConfig = {
    touchPoints: [
        { x: 50, name: 'Left edge' },
        { x: 175, name: 'Center' },
        { x: 300, name: 'Right edge' },
        { x: 25, name: 'Far left' },
        { x: 325, name: 'Far right' }
    ],
    testDuration: 500, // ms per test
    logResults: true
};

// Test results storage
const testResults = {
    touchEventsDetected: 0,
    paddleMovements: 0,
    errors: [],
    positions: []
};

// Helper function to create touch event
function createTouchEvent(type, x, y, target) {
    const touch = new Touch({
        identifier: 1,
        target: target,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y
    });
    
    return new TouchEvent(type, {
        touches: type === 'touchend' ? [] : [touch],
        targetTouches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true
    });
}

// Helper function to simulate touch sequence
function simulateTouchSequence(canvas, x, y, duration = 100) {
    return new Promise((resolve) => {
        const rect = canvas.getBoundingClientRect();
        const canvasX = x;
        const canvasY = y || rect.height / 2;
        
        console.log(`📱 Simulating touch at (${canvasX}, ${canvasY})`);
        
        // Get initial paddle position
        const initialPaddleInfo = getPaddleInfo();
        
        // Start touch
        const touchStart = createTouchEvent('touchstart', canvasX, canvasY, canvas);
        canvas.dispatchEvent(touchStart);
        testResults.touchEventsDetected++;
        
        // Move touch (simulate drag)
        setTimeout(() => {
            const touchMove = createTouchEvent('touchmove', canvasX, canvasY, canvas);
            canvas.dispatchEvent(touchMove);
            testResults.touchEventsDetected++;
            
            // End touch
            setTimeout(() => {
                const touchEnd = createTouchEvent('touchend', canvasX, canvasY, canvas);
                canvas.dispatchEvent(touchEnd);
                testResults.touchEventsDetected++;
                
                // Check if paddle moved
                const finalPaddleInfo = getPaddleInfo();
                if (finalPaddleInfo.x !== initialPaddleInfo.x) {
                    testResults.paddleMovements++;
                    testResults.positions.push({
                        touchX: canvasX,
                        paddleX: finalPaddleInfo.x,
                        moved: true
                    });
                    console.log(`✅ Paddle moved from ${initialPaddleInfo.x} to ${finalPaddleInfo.x}`);
                } else {
                    testResults.positions.push({
                        touchX: canvasX,
                        paddleX: finalPaddleInfo.x,
                        moved: false
                    });
                    console.log(`❌ Paddle did not move (stayed at ${finalPaddleInfo.x})`);
                }
                
                resolve();
            }, duration / 2);
        }, duration / 2);
    });
}

// Helper function to get current paddle information
function getPaddleInfo() {
    // Try to access React component state through global debug info
    const debugPanel = document.querySelector('.text-cyan-400');
    if (debugPanel) {
        const parent = debugPanel.parentElement;
        const paddleXElement = Array.from(parent.children).find(el => 
            el.textContent && el.textContent.includes('Paddle X:')
        );
        if (paddleXElement) {
            const paddleX = parseInt(paddleXElement.textContent.split('Paddle X: ')[1]);
            return { x: paddleX, found: true };
        }
    }
    
    // Fallback: try to estimate from canvas drawing
    const canvas = document.querySelector('canvas');
    return { x: 0, found: false, canvas: canvas ? 'found' : 'not found' };
}

// Main test function
async function runTouchTests() {
    console.log('🔍 Looking for game canvas...');
    
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        console.error('❌ Canvas not found! Make sure the game is loaded.');
        return;
    }
    
    console.log('✅ Canvas found:', canvas);
    console.log('📐 Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('📱 Canvas client dimensions:', canvas.clientWidth, 'x', canvas.clientHeight);
    
    // Check if mobile mode is detected
    const mobileControls = document.querySelector('.text-cyan-400');
    const isMobileMode = !!mobileControls;
    console.log('📱 Mobile mode detected:', isMobileMode);
    
    if (!isMobileMode) {
        console.warn('⚠️ Mobile controls not visible. Testing anyway...');
    }
    
    // Test each touch point
    console.log('🧪 Starting touch sequence tests...');
    
    for (let i = 0; i < testConfig.touchPoints.length; i++) {
        const point = testConfig.touchPoints[i];
        console.log(`\n📍 Test ${i + 1}/${testConfig.touchPoints.length}: ${point.name} (x=${point.x})`);
        
        try {
            await simulateTouchSequence(canvas, point.x, canvas.clientHeight / 2, testConfig.testDuration);
            await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause between tests
        } catch (error) {
            console.error(`❌ Error in test ${i + 1}:`, error);
            testResults.errors.push(`Test ${i + 1}: ${error.message}`);
        }
    }
    
    // Final results
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=========================');
    console.log(`Total touch events fired: ${testResults.touchEventsDetected}`);
    console.log(`Paddle movements detected: ${testResults.paddleMovements}`);
    console.log(`Success rate: ${((testResults.paddleMovements / testConfig.touchPoints.length) * 100).toFixed(1)}%`);
    
    if (testResults.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n📍 Position tracking:');
    testResults.positions.forEach((pos, index) => {
        const status = pos.moved ? '✅' : '❌';
        console.log(`  ${status} Touch ${pos.touchX} → Paddle ${pos.paddleX} (${pos.moved ? 'moved' : 'no movement'})`);
    });
    
    // Determine overall result
    if (testResults.paddleMovements >= testConfig.touchPoints.length * 0.8) {
        console.log('\n🎉 OVERALL RESULT: PASS - Touch controls are working correctly!');
    } else if (testResults.paddleMovements > 0) {
        console.log('\n⚠️ OVERALL RESULT: PARTIAL - Some touch controls working, needs investigation');
    } else {
        console.log('\n❌ OVERALL RESULT: FAIL - Touch controls not responding');
    }
    
    return testResults;
}

// Check if we're in a mobile viewport
function checkMobileViewport() {
    const isMobileViewport = window.innerWidth <= 768;
    const userAgent = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    console.log('📱 Mobile viewport:', isMobileViewport);
    console.log('📱 Mobile user agent:', isMobileUA);
    console.log('🖥️ Window size:', window.innerWidth, 'x', window.innerHeight);
    
    if (!isMobileViewport && !isMobileUA) {
        console.warn('⚠️ Not in mobile mode. To test mobile functionality:');
        console.warn('   1. Open browser dev tools (F12)');
        console.warn('   2. Click "Toggle device toolbar" icon');
        console.warn('   3. Select a mobile device');
        console.warn('   4. Refresh the page');
        console.warn('   5. Run this test again');
    }
}

// Auto-run tests
console.log('🚀 Initializing mobile touch test...');
checkMobileViewport();

// Wait a moment for the game to load, then run tests
setTimeout(() => {
    runTouchTests().then(() => {
        console.log('\n✨ Test completed! Check the results above.');
    });
}, 1000);

// Export test function for manual use
window.runTouchTests = runTouchTests;
console.log('💡 You can also run tests manually by typing: runTouchTests()');
