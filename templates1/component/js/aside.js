// tpl
$(".E-widget").each(function(){vv.tabs.getAttr(this)});
vv.ajax.init();
vv.event.init();

$('#clickBtn').on('click', function(){
	vv.tabs.trigger(this);
})