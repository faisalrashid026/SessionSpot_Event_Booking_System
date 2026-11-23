import AppKit
import Foundation
let root=URL(fileURLWithPath:CommandLine.arguments[1])
let pairs=[("01-discover-events","Discover events"),("02-create-account","Create account"),("03-sign-in","Sign in"),("04-reserve-tickets","Reserve tickets"),("05-organizer-dashboard","Organizer dashboard"),("06-my-bookings","My bookings")]
for (key,title) in pairs {
 let ref=NSImage(contentsOf:root.appendingPathComponent("design-reference/\(key).png"))!
 let render=NSImage(contentsOf:root.appendingPathComponent("qa/screenshots/\(key)-desktop.jpg"))!
 let width:CGFloat=1440, gap:CGFloat=32, header:CGFloat=76
 let refHeight=width*ref.size.height/ref.size.width
 let renderHeight=width*render.size.height/render.size.width
 let height=max(refHeight,renderHeight)+header+24
 let out=NSImage(size:NSSize(width:width*2+gap,height:height))
 out.lockFocus()
 NSColor.white.setFill();NSBezierPath(rect:NSRect(x:0,y:0,width:width*2+gap,height:height)).fill()
 let attrs:[NSAttributedString.Key:Any]=[.font:NSFont.systemFont(ofSize:22,weight:.semibold),.foregroundColor:NSColor(calibratedRed:0.24,green:0.19,blue:0.36,alpha:1)]
 ("Reference · \(title)" as NSString).draw(at:NSPoint(x:20,y:height-44),withAttributes:attrs)
 ("SessionSpot · rendered browser capture" as NSString).draw(at:NSPoint(x:width+gap+20,y:height-44),withAttributes:attrs)
 ref.draw(in:NSRect(x:0,y:height-header-refHeight,width:width,height:refHeight))
 render.draw(in:NSRect(x:width+gap,y:height-header-renderHeight,width:width,height:renderHeight))
 out.unlockFocus()
 let rep=NSBitmapImageRep(data:out.tiffRepresentation!)!
 let data=rep.representation(using:.png,properties:[:])!
 try data.write(to:root.appendingPathComponent("qa/\(key)-comparison.png"))
}
print("Created six labelled, unaltered full-frame reference/browser comparison boards.")
let tileWidth:CGFloat=1100, tileHeight:CGFloat=620, margin:CGFloat=24
let overview=NSImage(size:NSSize(width:tileWidth*2+margin*3,height:tileHeight*3+margin*4))
overview.lockFocus()
NSColor(calibratedWhite:0.96,alpha:1).setFill()
NSBezierPath(rect:NSRect(origin:.zero,size:overview.size)).fill()
for (index,pair) in pairs.enumerated() {
 let image=NSImage(contentsOf:root.appendingPathComponent("qa/\(pair.0)-comparison.png"))!
 let scale=min(tileWidth/image.size.width,tileHeight/image.size.height)
 let w=image.size.width*scale,h=image.size.height*scale
 let x=margin+CGFloat(index%2)*(tileWidth+margin)+(tileWidth-w)/2
 let y=overview.size.height-margin-CGFloat(index/2)*(tileHeight+margin)-h
 image.draw(in:NSRect(x:x,y:y,width:w,height:h))
}
overview.unlockFocus()
let overviewRep=NSBitmapImageRep(data:overview.tiffRepresentation!)!
try overviewRep.representation(using:.png,properties:[:])!.write(to:root.appendingPathComponent("qa/comparison-overview.png"))
print("Created six-screen overview.")
