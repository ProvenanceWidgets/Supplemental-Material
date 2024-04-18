## Add your Feedback here.

- Had some trouble loading the csv because I was unfamiliar with the Vite setup
- To speed up loading, I computed umap embeddings once then saved the output. All subsequent data used the pokemon.json with the embeddings pre-computed.
- Options input for the selection widgets were unintuitive since it wasn't a simple Array and required further details
- This tripped me up again when I was implementing the onchange function. I did not realize event.detail was an Array of objects, instead of a simple Array.
- When I initialize checkbox with checkbox.selected = options, the options do not show up as checked
- OKAY. I just realized that the checkbox.selected should be options.map(d => d.code) instead of just options. Just FYI, using options seems to work for multiselect, but breaks down for checkbox, so there is some unexpected inconsistency between the widgets.
- I think maybe adding an example for using the range slider would be helpful, since the highValue attribute is quite different from the other widgets.
- I couldn't think of a use for text box, but otherwise all other widgets were quite straightforward to use.