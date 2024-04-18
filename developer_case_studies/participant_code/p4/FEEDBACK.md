## Add your Feedback here.

### What I did
- My Pokemon Explorer lets users modify a scatterplot's X, Y, and Color encodings. 
- In addition, if someone wants to export the charts, then they might need to modify the aesthetics, so I used the widgets to modify the font size, point size, and also the point opacity. Nifty.
- Lastly, if someone wants to look at a smaller data subset, I also provided the ability to filter by some columns. Given more time, I figured it would be very easy to add the others as well.
- I also implemented the bonus question and made the app two-way-communicable. Basically, if I brush in the vis, then the widget scents will accordingly update, capturing the data I've focused on. Conversely, if I modify the widget themselves, then the visualization will also filter. Impressive.


### Yays
- Very cool library, I'm a fan. Design wise, everything is mostly consistent.
- The ability to modify the provenance externally is particularly very, very powerful. I can see myself using these widgets as-is (as they are exposing everything Primeng does any way) and also for provenance applications, if I ever have to do those.


### Nays/Feature requests
- I didn't like the orange color scale, I wish I could easily change it.
- What if I only want to track frequency and not recency? Can I do that? The freeze and visualize mode will either turn the entire thing on or off. I could maybe hack it by modifying the internal provenance model with each interaction (e.g., make all timestamps the same) but that is very inefficient.
- I would love if the visualization scents were responsive.
- To me, checkbox is very similar to a multiselect dropdown. I just didn't like that I had to have a different data model for Is Legendary (checkbox) and Primary Type (multiselect). This can be improved.
- The temporal range slider in the detailed view doesn't have any precision. Just showing n=0 to now doesn't help me in accurately filtering my provenance. This can be improved.
- The tooltip that shows up on hovering some annoyingly stays back even after the panel has closed. Also, towards the edges, it goes outside the screen. I'm sure these are fixable.
- Minor but why are the footprints icon of different sizes for different widgets? Was it something only on my computer?
- For the name filter (input text), I see why you added \<empty\> when I cleared the search. Not sure if I have a better default but it just looks a little odd, that's it.
- There is some inconsistency in how the widgets react when we click on the same item or make the same selection. Sometimes it appends a new item to the provenance, sometimes it doesn't. Fixable.
- In range slider and slider, the tooltip shows 0th/7th interaction for the first point. How can 0th be a value? Maybe it shows interaction and not selection?
- I wanted to rotate one of the dropdown widgets by 90 degrees to align it alongside the y axis title. I did `transform: rotate(-90deg);` The visualization scents worked fine, I think, but the ticks themselves were all jumbled up. As a workaround, I tried to remove the tick labels but it didn't work.
- Precision in the tooltip for different values is too high, unnecessarily, e.g., attack=33.348375938494.
- Dynamically resetting the widget extents, provenance, model, etc has some inconsistency. Checkout the two grayed out/disabled sliders below the chart. They are showing the range of values explored in the visualization after brushing in the chart.