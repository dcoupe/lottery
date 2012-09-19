function in_array(item, list){
	for(var i=0; i<list.length; i++){
		if(item == list[i]){
			return true;
		}
	}
	return false;
}

/**
 * 返回指定元素在数组中的索引, 如果没找到, 返回-1;
 */
function array_find(list, item){
	for(var i=0; i<list.length; i++){
		if(item == list[i]){
			return i;
		}
	}
	return -1;
}

// 从数组中删除元素. 返回新数组.
function array_del(list, item){
	var arr = [];
	for(var i=0; i<list.length; i++){
		if(item != list[i]){
			arr.push(list[i]);
		}
	}
	return arr;
}

// 从数组中删除元素. 返回新数组.
function array_del_all(list, items){
	var arr = [];
	for(var i=0; i<list.length; i++){
		if(array_find(items, list[i]) == -1){
			arr.push(list[i]);
		}
	}
	return arr;
}

/**
 * 把数组当作环形的, 返回从start开始, 一共count个元素.
 * 如果count大于数组长度, 返回整个数组.
 */
function array_slice(list, start, count){
	var ret;

	ret = list.slice(start, start + count);
	if(ret.length < count){
		ret = ret.concat(list.slice(0, count - ret.length));
	}

	return ret;
}

// 扰乱数组元素的顺序.
function array_shuffle(list){
	var len = list.length;
	for(var i=0; i<len*5; i++){
		var p1 = parseInt(len * Math.random());
		var p2 = parseInt(len * Math.random());
		var tmp = list[p1];
		list[p1] = list[p2];
		list[p2] = tmp;
	}
}


/*
状态/动作

开场(open)
循环{
	奖项开场(step_open)
	奖项抽奖(rotate_start)
	奖项抽奖(rotate_stop)
	奖项闭场(step_close)
}
闭场(close)

*/
var Game = function(){
	var self = this;

	this.step = -1;
	this.interval = 100;
	this.rotate_index = 0;
	self.action = 'open';

	this.prizes = [];
	this.candidates = [];
	this.results = [];

	this.init = function(){
		this.step = 0;
		this.stop = false;
		this.rotate_index = 0;
		self.action = 'open';
		this.results = [];

		for(var i=0; i<self.prizes.length; i++){
			var p = self.prizes[i];
			self.results[i] = [];
		}
		
		show_current_step('');
		var str = '请按回车键开始';
		str += '<br/><br/>';
		print_box('请按回车键开始');
		
		$('#rolling_board').hide();
		$('#rotate_div').css('background', '');
	}

	this.reset = function(){
		this.prizes = [];
		this.candidates = [];
		this.results = [];
	}

	this.process = function(){
		show_results();

		// 先更新状态再执行函数
		switch(self.action){
			case 'open':
				self.action = 'step_open';
				$('#rotate_div').hide();
				on_open();
				$('#rotate_div').fadeIn('slow');
				break;
			case 'close':
				self.action = '';
				on_close();
				break;
			case 'step_open':
				self.action = 'rotate_start';
				$('#rotate_div').hide();
				on_step_open();
				$('#rotate_div').fadeIn('fast');
				break;
			case 'step_close':
				if(self.step == self.prizes.length){
					self.action = 'close';
				}else{
					self.action = 'step_open';
				}
				on_step_close();
				break;
			case 'rotate_start':
				self.action = 'rotate_stop';
				on_rotate_start();
				break;
			case 'rotate_stop':
				on_rotate_stop();
				break;
			default:
				save_setting();
				break;
		}
	};
}

function on_open(){
	show_current_step('奖项设置');

	var str = '<table class="table table-bordered" style="background:#fff">';
	str += '<tr><th>奖项</th><th>数量</th><th>奖品</th></tr>\n';
	for(var i=game.prizes.length-1; i>=0; i--){
		var p = game.prizes[i];
		str += '<tr><td>' + p.name + '</td><td>' + p.num + '</td><td>' + p.award + '</td></tr>\n';
	}
	str += '</table>';
	print_box(str);
}

function on_close(){
	show_current_step('');

	$('#print_box').hide();
	var str = '';
	str += '<span><b>抽奖结束</b></span>';
	print_box(str);
}

function on_step_open(){
	show_current_step();
	print_box('按回车键开始');
	$('#rolling_board').html('...');
}

function on_step_close(){
	var str = '';
	str += '<span style="font-size:30px;">&nbsp;* 中奖名单 *&nbsp;</span><br/><br/><br/><div style="color: #D14; font-size:40px; font-weight:700;text-align:left; line-height:1.5">';
	var r = game.results[game.step - 1];
	for(var n=0; n<r.length; n++){
		str += r[n] +'&nbsp;&nbsp;';
	}
	str += '</div>';
	
	print_box(str);
	$('#rolling_board').slideUp('normal');
}

function on_rotate_start(){
	$('#rolling_board').slideDown('normal');

	game.interval = parseInt($('input[name=interval]').val());

	game.stop = false;
	game.rotate_index = 0;

	// 打乱顺序
	array_shuffle(game.candidates);
	
	rotate_run();

	show_current_step();
	print_box('按回车键停止');
}


function on_rotate_stop(){
	// 等一段随机时间再停止.
	game.interval += parseInt(0.9 * game.interval);
	setTimeout('game.stop=true', 230 + parseInt(230*Math.random()));
	//game.stop = true;
}


function rotate_run(){
	var num_a = game.prizes[game.step].num_a_time;
	var size = game.prizes[game.step].num - game.results[game.step].length;
	if(size > num_a){
		size = num_a;
	}

	var arr = array_slice(game.candidates, game.rotate_index, size);
	$('#rolling_board').html(arr.join(' '));

	game.rotate_index += num_a;
	if(game.rotate_index >= game.candidates.length){
		game.rotate_index -= game.candidates.length;
	}

	if(game.stop){
		game.action = 'rotate_start';
		
		game.results[game.step] = game.results[game.step].concat(arr);
		game.candidates = array_del_all(game.candidates, arr);

		show_results();
		print_box('按回车键继续');

		if(game.results[game.step].length == game.prizes[game.step].num){
			game.step ++;
			game.action = 'step_close';
		}

		var h = '<span style="color: #D14">' + $('#rolling_board').html() + '</span>';
		$('#rolling_board').html(h)
	}else{
		setTimeout('rotate_run()', game.interval);
	}
}


function show_current_step(str){
	if(str == undefined){
		var found = game.results[game.step].length;
		var all = game.prizes[game.step].num;
		var num_a = game.prizes[game.step].num_a_time;
		var b = (num_a+found) > all? all : (num_a+found);

		var str = game.prizes[game.step].name + '(' + game.prizes[game.step].num + '个';
		if(num_a != all){
			str += ', ' + (found + 1) + '-' + b;
		}
		str +=  ')';
	}
	if(str == ''){
		$('#current_step').hide('fast');
	}else{
		$('#current_step').html(str);
		$('#current_step').show();
	}
}

function print_box(str){
	if(str == undefined){
		var str = '<span>';
		var r = game.results[game.step];
		for(var n=0; n<r.length; n++){
			str += r[n] + ' &nbsp;';
		}
		str += '</span>';
	}
	if(str == ''){
		$('#print_box').hide('fast');
	}else{
		$('#print_box').html(str);
		$('#print_box').show();
	}
}

function show_results(){
	var str = '';
	for(var i=game.results.length-1; i>=0; i--){
		str += '<label>' + game.prizes[i].name + ':</label>';
		var r = game.results[i] ;
		for(var n=0; n<r.length; n++){
			str += '<span>'+ r[n] + '</span>';
		}
		str += '<br/>';
	}
	$('#result').html(str);
}


function save_setting(){
	var str = '';
	game.reset();

	var ps = $.trim($('textarea[name=prizes]').val()).split('\n');
	for(var i=0; i<ps.length; i++){
		var p = $.trim(ps[i]);
		if(p.length == 0){
			continue;
		}
		var ex = p.split('|');
		var prize = {
			name : $.trim(ex[0]),
			num : parseInt($.trim(ex[1])),
			num_a_time : parseInt($.trim(ex[2])),
			award : $.trim(ex[3])
		};
		game.prizes.push(prize);
	}

	var ps = $.trim($('textarea[name=candidates]').val()).replace(/,/g, '\n').split('\n');
	for(var i=0; i<ps.length; i++){
		var p = $.trim(ps[i]);
		if(p.length == 0){
			continue;
		}
		game.candidates.push(p);
		str += '<span>'+ p + '</span>';
	}
	$('#candidate').html(str);

	game.init();
}