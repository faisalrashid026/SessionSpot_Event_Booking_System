import AppKit
import Foundation
let root=URL(fileURLWithPath:CommandLine.arguments[1])
let frames=[("index","2:2","Discover events",1320.0),("register","2:238","Create account",1160.0),("login","2:240","Sign in",1160.0),("reserve","2:242","Reserve tickets",1160.0),("dashboard","2:307","Organizer dashboard",1160.0),("my-bookings","2:372","My bookings",1160.0)]
func write(_ image:NSImage,_ path:URL)throws{let rep=NSBitmapImageRep(data:image.tiffRepresentation!)!;try rep.representation(using:.png,properties:[:])!.write(to:path)}
for (page,node,title,frameHeight) in frames {
 let reference=NSImage(contentsOf:root.appendingPathComponent("qa/figma/\(page)-render.png"))!
 let browser=NSImage(contentsOf:root.appendingPathComponent("qa/figma/\(page)-browser.jpg"))!
 let width:CGFloat=1440,gap:CGFloat=32,header:CGFloat=76,height:CGFloat=frameHeight
 let board=NSImage(size:NSSize(width:width*2+gap,height:height+header))
 board.lockFocus();NSColor.white.setFill();NSBezierPath(rect:NSRect(origin:.zero,size:board.size)).fill()
 let attributes:[NSAttributedString.Key:Any]=[.font:NSFont.systemFont(ofSize:22,weight:.semibold),.foregroundColor:NSColor(calibratedRed:0.24,green:0.19,blue:0.36,alpha:1)]
 ("Actual Figma · \(node) · \(title)" as NSString).draw(at:NSPoint(x:20,y:height+28),withAttributes:attributes)
 ("SessionSpot · browser · matched 1440px frame" as NSString).draw(at:NSPoint(x:width+gap+20,y:height+28),withAttributes:attributes)
 reference.draw(in:NSRect(x:0,y:0,width:width,height:height))
 browser.draw(in:NSRect(x:width+gap,y:0,width:width,height:height))
 board.unlockFocus();try write(board,root.appendingPathComponent("qa/figma/\(page)-comparison.png"))
}
let tileW:CGFloat=1100,tileH:CGFloat=570,margin:CGFloat=24
let overview=NSImage(size:NSSize(width:tileW*2+margin*3,height:tileH*3+margin*4))
overview.lockFocus();NSColor(calibratedWhite:0.96,alpha:1).setFill();NSBezierPath(rect:NSRect(origin:.zero,size:overview.size)).fill()
for (i,frame) in frames.enumerated(){let image=NSImage(contentsOf:root.appendingPathComponent("qa/figma/\(frame.0)-comparison.png"))!;let scale=min(tileW/image.size.width,tileH/image.size.height);let w=image.size.width*scale,h=image.size.height*scale;let x=margin+CGFloat(i%2)*(tileW+margin)+(tileW-w)/2;let y=overview.size.height-margin-CGFloat(i/2)*(tileH+margin)-h;image.draw(in:NSRect(x:x,y:y,width:w,height:h))}
overview.unlockFocus();try write(overview,root.appendingPathComponent("qa/figma/comparison-overview.png"))
print("Created six actual-Figma/browser comparison boards and overview.")
