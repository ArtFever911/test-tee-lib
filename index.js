
let data = window.TreeAPI.getData();
data.then(result=>{
	const newTree = new TreeBuilder(data);
});