# -*- coding: utf-8 -*-
import json, uuid, zipfile, shutil
from pathlib import Path

OUT = Path('exports/sketch')
WORK = OUT / '.sketch_work'
SKETCH = OUT / 'campus-mental-health-miniapp-editable.sketch'
OUT.mkdir(parents=True, exist_ok=True)
if WORK.exists(): shutil.rmtree(WORK)
(WORK / 'pages').mkdir(parents=True, exist_ok=True)

def uid(): return str(uuid.uuid4()).upper()
def rect(x,y,w,h): return {'_class':'rect','constrainProportions':False,'height':h,'width':w,'x':x,'y':y}
def color(h,a=1):
    h=h.strip('#')
    return {'_class':'color','alpha':a,'red':int(h[0:2],16)/255,'green':int(h[2:4],16)/255,'blue':int(h[4:6],16)/255}
def fill(h,a=1): return {'_class':'fill','isEnabled':True,'fillType':0,'color':color(h,a),'contextSettings':{'_class':'graphicsContextSettings','blendMode':0,'opacity':1}}
def border(h='DDE3F2',a=1,t=1): return {'_class':'border','isEnabled':True,'fillType':0,'color':color(h,a),'thickness':t,'position':1,'contextSettings':{'_class':'graphicsContextSettings','blendMode':0,'opacity':1}}
def shadow(): return {'_class':'shadow','isEnabled':True,'color':color('697399',.13),'offsetX':0,'offsetY':8,'blurRadius':22,'spread':0,'contextSettings':{'_class':'graphicsContextSettings','blendMode':0,'opacity':1}}
def style(fills=None,borders=None,shadows=None): return {'_class':'style','fills':fills or [],'borders':borders or [],'shadows':shadows or [],'innerShadows':[],'contextSettings':{'_class':'graphicsContextSettings','blendMode':0,'opacity':1}}
def cp(p,r=0): return {'_class':'curvePoint','cornerRadius':r,'curveFrom':p,'curveMode':1,'curveTo':p,'hasCurveFrom':False,'hasCurveTo':False,'point':p}

def box(name,x,y,w,h,bg='FFFFFF',r=16,stroke='DDE3F2',shadow_on=False,opacity=1):
    return {'_class':'shapeGroup','do_objectID':uid(),'name':name,'frame':rect(x,y,w,h),'style':style([fill(bg,opacity)],[border(stroke,1,1)] if stroke else [],[shadow()] if shadow_on else []),'booleanOperation':-1,'clippingMaskMode':0,'hasClippingMask':False,'isVisible':True,'isLocked':False,'layerListExpandedType':0,'nameIsFixed':False,'resizingConstraint':63,'resizingType':0,'rotation':0,'shouldBreakMaskChain':False,'windingRule':1,'layers':[{'_class':'rectangle','do_objectID':uid(),'edited':False,'fixedRadius':r,'frame':rect(0,0,w,h),'isClosed':True,'pointRadiusBehaviour':1,'points':[cp('{0, 0}',r),cp('{1, 0}',r),cp('{1, 1}',r),cp('{0, 1}',r)]}]}

def txt(name,s,x,y,w,h,sz=14,wt='Regular',c='26304D',align=0,line=20):
    font={'Regular':'PingFangSC-Regular','Medium':'PingFangSC-Medium','Semibold':'PingFangSC-Semibold','Bold':'PingFangSC-Semibold'}.get(wt,'PingFangSC-Regular')
    return {'_class':'text','do_objectID':uid(),'name':name,'frame':rect(x,y,w,h),'isVisible':True,'isLocked':False,'resizingConstraint':63,'resizingType':0,'rotation':0,'shouldBreakMaskChain':False,'layerListExpandedType':0,'nameIsFixed':False,'automaticallyDrawOnUnderlyingPath':False,'dontSynchroniseWithSymbol':False,'lineSpacingBehaviour':2,'textBehaviour':1,'glyphBounds':'{{0, 0}, {%s, %s}}'%(w,h),'attributedString':{'_class':'attributedString','string':s,'attributes':[{'_class':'stringAttribute','location':0,'length':len(s),'attributes':{'MSAttributedStringFontAttribute':{'_class':'fontDescriptor','attributes':{'name':font,'size':sz}},'MSAttributedStringColorAttribute':color(c,1),'paragraphStyle':{'_class':'paragraphStyle','alignment':align,'minimumLineHeight':line,'maximumLineHeight':line}}}]},'style':style([])}

def pill(label,x,y,tone='blue',w=None):
    palette={'blue':('EEF2FF','5662E8','D6DFFF'),'red':('FFF0F0','D94B4B','FFD4D4'),'green':('ECF8F0','21895B','CBEED9'),'gray':('F4F6FA','68728B','E0E5F0'),'amber':('FFF6DF','9B6700','FFE6A8'),'purple':('F4F0FF','7257E8','DDD4FF')}
    bg,fg,bd=palette[tone]; w=w or max(58,len(label)*12+22)
    return [box('标签 / '+label,x,y,w,28,bg,14,bd), txt('标签文字',label,x+10,y+5,w-20,18,12,'Semibold',fg,1,18)]

def button(label,x,y,w,primary=True):
    if primary: return [box('主按钮 / '+label,x,y,w,42,'6C5CE7',14,None), txt('按钮文字',label,x,y+11,w,20,15,'Semibold','FFFFFF',1,20)]
    return [box('次按钮 / '+label,x,y,w,42,'FFFFFF',14,'D9DEF0'), txt('按钮文字',label,x,y+11,w,20,15,'Semibold','52607A',1,20)]

def header(L,title,org,back=False):
    if back:
        L += [box('返回按钮',18,24,30,30,'FFFFFF',15,'E1E6F2'), txt('返回箭头','‹',25,20,16,30,26,'Regular','536079',1,30)]
    x=56 if back else 18
    L += [txt('顶部角色',org,x,18,260,18,13,'Semibold','7D879E'), txt('顶部标题',title,x,38,295,30,22,'Semibold','1E2740',0,28)]

def hero(L,eyebrow,title,desc,icon='◎'):
    L += [box('Hero 背景',18,82,339,138,'FFFFFF',22,'E1E7F6',True), txt('Hero eyebrow',eyebrow,38,104,220,20,14,'Semibold','6E5AEF'), txt('Hero 标题',title,38,128,238,36,26,'Semibold','1E2740',0,32), txt('Hero 描述',desc,38,170,250,38,14,'Regular','65708A',0,20), box('角色图标徽章',292,106,46,46,'EEF2FF',23,'DDE5FF'), txt('角色图标',icon,303,115,24,24,20,'Semibold','5D63E8',1,24)]

def section(L,title,y,rows,note=None):
    h=52+len(rows)*34+(40 if note else 0)
    L += [box('模块 / '+title,18,y,339,h,'FFFFFF',18,'E2E7F4',True), txt('模块标题',title,36,y+16,300,24,18,'Semibold','232C46')]
    cy=y+50
    for k,v in rows:
        L += [txt('字段名',k,36,cy,86,20,13,'Medium','7A849D'), txt('字段值',v,124,cy,212,22,14,'Medium','2B3550',0,20)]
        cy += 34
    if note: L.append(txt('说明',note,36,cy,300,36,13,'Regular','68728B',0,18))
    return y+h+16

def task_card(L,y,title,status,rows,tags,actions,tone='blue'):
    h=154+(32 if tags else 0)
    L += [box('任务卡 / '+title,18,y,339,h,'FFFFFF',18,'E3E8F4',True), txt('任务标题',title,36,y+18,214,24,19,'Semibold','202946')]
    L += pill(status,260,y+16,tone,78)
    cy=y+52
    for k,v in rows:
        L += [txt('任务字段',k,36,cy,58,20,13,'Medium','818AA1'), txt('任务值',v,96,cy,232,20,14,'Medium','303A55')]
        cy += 25
    tx=36
    for t in tags[:2]:
        L += pill(t,tx,cy+2,'gray'); tx += max(76,len(t)*12+30)
    by=y+h-52; aw=145 if len(actions)>1 else 300
    for i,(lab,primary) in enumerate(actions[:2]): L += button(lab,36+i*(aw+12),by,aw,primary)
    return y+h+16

def bottom_bar(L,actions,height):
    y=height-76
    L.append(box('底部操作栏',0,y,375,76,'FFFFFF',0,'E5EAF5',True))
    w=155 if len(actions)>1 else 320; sx=24 if len(actions)>1 else 28
    for i,(lab,primary) in enumerate(actions[:2]): L += button(lab,sx+i*(w+16),y+16,w,primary)

def drawer(L,height,title,rows,actions):
    L.append(box('弹层遮罩',0,0,375,height,'111827',0,None,False,.35))
    sy=max(360,height-560)
    L += [box('底部抽屉',0,sy,375,height-sy,'FFFFFF',24,'E1E6F2',True), txt('抽屉标题',title,24,sy+32,300,30,22,'Semibold','1E2740')]
    y=section(L,'操作确认',sy+84,rows)
    L.append(txt('隐私提示','外部提醒不包含学生姓名、测评原文、咨询记录、敏感题项、AI 原始判断或具体心理风险原因。',24,y,327,48,13,'Regular','68728B',0,18))
    bottom_bar(L,actions,height)

def make_screen(spec):
    name,kind,height=spec
    L=[box('页面背景',0,0,375,height,'F5F7FF',0,None)]
    if kind=='homeroom_home':
        header(L,'我的观察任务','高二年级 · 班主任'); hero(L,'班主任工作台','有 1 项待反馈','只展示分配给我的观察任务，反馈事实观察。','◎'); L+=pill('待反馈',18,236,'blue',94)+pill('已提交',120,236,'gray',94)+pill('已完成',222,236,'gray',94); y=286; y=task_card(L,y,'陈同学','待反馈',[('优先级','高'),('截止','今天 18:00'),('状态','等待观察反馈')],['情绪波动','出勤变化'],[('查看任务',False),('填写反馈',True)],'red'); y=task_card(L,y,'许同学','已完成',[('优先级','常规'),('截止','06-08 17:00'),('状态','已闭环')],['复测完成','状态稳定'],[('查看任务',False)],'green'); section(L,'隐私边界',y,[('不可查看','测评原文、敏感题项、AI 原始判断'),('填写范围','事实观察')])
    elif kind=='homeroom_detail':
        header(L,'观察任务详情','高二年级 · 班主任',True); y=84; y=section(L,'学生与任务',y,[('学生','陈同学'),('班级','高二（3）班'),('优先级','高'),('截止','今天 18:00'),('状态','待反馈')]); y=section(L,'必要观察重点',y,[('重点一','近一周情绪波动'),('重点二','出勤与迟到变化'),('重点三','课堂参与度')],'仅记录可观察事实，不填写心理判断或风险结论。'); y=section(L,'我的反馈状态',y,[('状态','尚未提交观察反馈'),('下一步','填写观察时间段、场景、异常表现')]); bottom_bar(L,[('上报协作线索',False),('填写反馈',True)],height)
    elif kind=='homeroom_form':
        header(L,'填写观察反馈','高二年级 · 班主任',True); y=84; y=section(L,'事实观察字段',y,[('观察时间段','今天上午'),('观察场景','课堂 / 课间'),('异常表现','课堂回应减少'),('发生频率','近两天偶发'),('影响程度','轻度影响课堂参与'),('已采取措施','一次低压力关心'),('尽快查看','是')]); L += [box('事实描述输入框',18,y,339,150,'FFFFFF',18,'E1E7F4',True), txt('输入框标题','事实描述',36,y+18,300,22,15,'Semibold','2B3550'), txt('输入框内容','请补充课堂、课间和家校沟通中的具体观察事实，避免主观判断。',36,y+48,295,72,14,'Regular','6A748C',0,20)]; y+=170; section(L,'提交说明',y,[('提交后状态','已提交给心理老师，等待专业确认')]); bottom_bar(L,[('保存草稿',False),('提交反馈',True)],height)
    elif kind=='clue_report':
        header(L,'上报协作线索','高二年级 · 班主任',True); y=84; y=section(L,'线索类型',y,[('类型','家校沟通 / 出勤变化 / 同伴互动'),('对象','选择与我相关的观察任务')]); L += [box('线索描述输入框',18,y,339,180,'FFFFFF',18,'E1E7F4',True), txt('输入框标题','线索描述',36,y+18,300,22,15,'Semibold','2B3550'), txt('输入框内容','描述看到或收到的具体事实，例如时间、地点、行为变化、已采取措施。',36,y+50,295,82,14,'Regular','6A748C',0,20)]; y+=200; section(L,'隐私提示',y,[('边界','作为协作线索，由心理老师复核后判断')]); bottom_bar(L,[('取消',False),('提交线索',True)],height)
    elif kind=='counselor_home':
        header(L,'待确认反馈','校心理中心 · 心理老师'); hero(L,'心理老师工作台','有 5 项待确认','优先处理班主任反馈与逾期未更新任务。','♡'); L+=pill('待确认',18,236,'blue',94)+pill('处理中',120,236,'gray',94)+pill('已闭环',222,236,'gray',94); y=286; y=task_card(L,y,'林同学 · 观察任务','待确认',[('责任人','王老师'),('截止','明天 12:00'),('反馈','查看已提交反馈')],[],[('查看复核详情',False),('确认反馈',True)],'blue'); y=task_card(L,y,'吴同学 · 观察任务','逾期',[('责任人','孙老师'),('截止','昨天 17:00'),('反馈','等待观察反馈')],[],[('查看复核详情',False)],'red'); section(L,'提醒',y,[('逾期未更新','3 项'),('说明','原始测评与 AI 判断仅心理老师可见')])
    elif kind in ['counselor_detail','counselor_drawer']:
        header(L,'反馈确认详情','校心理中心 · 心理老师',True); y=84; y=section(L,'学生基础信息',y,[('学生','林同学'),('班级','高二（1）班'),('状态','已反馈待确认'),('责任班主任','王老师')]); y=section(L,'班主任已提交反馈',y,[('时间','06-09 16:20'),('反馈摘要','课后沟通完成，课堂状态较上周稳定')]); y=section(L,'异常观察要点',y,[('重点','同伴关系变化'),('补充','家校沟通情况、午休状态')]); y=section(L,'专业判断边界',y,[('说明','班主任反馈仅作为协作线索')],'是否进入干预流程，需结合访谈、测评和既有记录判断。'); y=section(L,'完整处置时间线',y,[('06-09 09:00','AI 风险线索生成'),('06-09 09:30','心理老师复核'),('06-09 10:00','分发协作任务'),('06-09 16:20','班主任提交观察反馈')]); bottom_bar(L,[('请班主任补充反馈',False),('确认进入干预',True)],height)
        if kind=='counselor_drawer': drawer(L,height,'请班主任补充反馈',[('补充原因','观察时间不明确 / 场景描述不足 / 缺少近期行为变化'),('补充说明','请补充近 3 天课堂、课间和家校沟通中的具体观察事实'),('通知方式','小程序待办 + 短信提醒')],[('取消',False),('发送补充请求',True)])
    elif kind=='grade_home':
        header(L,'年级督办','高二年级组 · 年级主任'); hero(L,'年级主任工作台','本年级有 4 项需督办','只查看本年级任务进度和脱敏摘要。','♢'); L+=pill('待反馈',18,236,'blue',94)+pill('已逾期',120,236,'red',94)+pill('已跟进',222,236,'gray',94); y=286; y=task_card(L,y,'高二（3）班 · C同学','待反馈',[('责任人','李老师'),('截止','今天 18:00'),('状态','班主任尚未提交')],['脱敏摘要'],[('查看督办详情',False),('提醒反馈',True)],'red'); y=task_card(L,y,'高二（1）班 · L同学','已跟进',[('责任人','王老师'),('截止','明天 12:00'),('状态','等待心理老师确认')],[],[('查看督办详情',False)],'green'); section(L,'权限边界',y,[('不可查看','AI 原始判断、敏感题项、咨询记录、完整干预细节')])
    elif kind in ['grade_detail','grade_drawer']:
        header(L,'督办详情','高二年级组 · 年级主任',True); y=84; y=section(L,'脱敏任务摘要',y,[('对象','高二（3）班 · C同学'),('责任班主任','李老师'),('状态','待反馈'),('截止','今天 18:00')]); y=section(L,'督办状态',y,[('班主任提交','未提交'),('是否逾期','未逾期'),('心理老师状态','等待观察反馈')]); section(L,'可执行操作',y,[('操作','提醒班主任反馈'),('限制','不填写心理跟进记录')]); bottom_bar(L,[('返回首页',False),('提醒班主任反馈',True)],height)
        if kind=='grade_drawer': drawer(L,height,'提醒班主任反馈',[('提醒对象','责任班主任'),('提醒事项','观察反馈待提交'),('通知方式','小程序待办 + 短信提醒'),('消息预览','李老师，您有一条学生观察反馈待办，请于今天 18:00 前完成反馈。')],[('取消',False),('发送提醒并留痕',True)])
    elif kind in ['principal_home','principal_drawer']:
        header(L,'预警督办 / 消息中心','学校管理层 · 校级管理者'); hero(L,'校级全局视角','危险待推进 2','只展示聚合处置压力和脱敏关注事项。','△'); y=236
        for i,(lab,val) in enumerate([('危险待推进','2'),('超时未处理','3'),('干预中','12'),('今日闭环','4')]):
            x=18+(i%2)*174; yy=y+(i//2)*82; L += [box('指标卡',x,yy,165,66,'FFFFFF',16,'E2E7F4',True), txt('指标数字',val,x+16,yy+12,60,28,26,'Semibold','5B5CEB'), txt('指标标签',lab,x+74,yy+20,80,20,13,'Medium','65708A')]
        y+=178; y=section(L,'需立即关注',y,[('高二（3）班 · C同学','高优先级 / 已超时 2 小时 / 已通知年级主任、班主任'),('高三（2）班 · W同学','转介资源排队 / 剩余 6 小时 / 已通知心理负责人'),('高一年级 · 5项未回收','中优先级 / 今日内处理 / 已通知年级负责人')]); section(L,'隐私边界',y,[('原则','校级视角不进入个体学生详情'),('不展示','姓名、班级细节、测评原文、咨询记录、敏感题项、AI 原始判断')])
        if kind=='principal_drawer': drawer(L,height,'提醒年级负责人',[('处理对象','年级负责人'),('事项摘要','高二年级连续 48 小时未更新'),('通知方式','小程序待办 + 短信提醒'),('消息预览','陈老师，您有一条心理风险协作督办待处理，请进入小程序查看并推进。')],[('取消',False),('确认发送',True)])
    return {'_class':'artboard','do_objectID':uid(),'name':name,'frame':rect((screens.index(spec)%4)*435,(screens.index(spec)//4)*2200,375,height),'layers':L,'includeInCloudUpload':True,'hasBackgroundColor':True,'backgroundColor':color('F5F7FF'),'horizontalRulerData':{'_class':'rulerData','base':0,'guides':[]},'verticalRulerData':{'_class':'rulerData','base':0,'guides':[]},'resizingConstraint':63,'resizingType':0,'rotation':0,'isVisible':True,'isLocked':False,'layerListExpandedType':0,'nameIsFixed':False,'shouldBreakMaskChain':False,'style':style([])}

screens=[('01 班主任 / 首页','homeroom_home',821),('02 班主任 / 观察任务详情','homeroom_detail',1363),('03 班主任 / 填写观察反馈','homeroom_form',1576),('04 班主任 / 上报协作线索','clue_report',1276),('05 心理老师 / 首页','counselor_home',934),('06 心理老师 / 反馈确认详情','counselor_detail',2009),('07 心理老师 / 补充反馈确认抽屉','counselor_drawer',2009),('08 年级主任 / 首页','grade_home',812),('09 年级主任 / 督办详情','grade_detail',1311),('10 年级主任 / 提醒确认抽屉','grade_drawer',1311),('11 校长 / 首页','principal_home',1532),('12 校长 / 督办确认抽屉','principal_drawer',1532)]
page_id=uid(); layers=[]; artboards={}
for spec in screens:
    ab=make_screen(spec); layers.append(ab); artboards[ab['do_objectID']]={'name':ab['name']}
page={'_class':'page','do_objectID':page_id,'name':'小程序改稿','layers':layers,'clippingMaskMode':0,'hasClickThrough':True,'horizontalRulerData':{'_class':'rulerData','base':0,'guides':[]},'verticalRulerData':{'_class':'rulerData','base':0,'guides':[]}}
(WORK/'pages'/f'{page_id}.json').write_text(json.dumps(page,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
document={'_class':'document','do_objectID':uid(),'assets':{'_class':'assetCollection','colors':[],'gradients':[],'images':[],'imageCollection':{'_class':'imageCollection','images':{}},'colorspace':0},'colorSpace':0,'currentPageIndex':0,'foreignLayerStyles':[],'foreignSymbols':[],'foreignTextStyles':[],'layerStyles':{'_class':'sharedStyleContainer','objects':[]},'layerTextStyles':{'_class':'sharedTextStyleContainer','objects':[]},'pages':[{'_class':'MSJSONFileReference','_ref_class':'MSImmutablePage','_ref':f'pages/{page_id}'}],'symbols':[],'enableLayerInteraction':True}
(WORK/'document.json').write_text(json.dumps(document,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
meta={'commit':'local-generated-by-codex','version':150,'compatibilityVersion':99,'app':'com.bohemiancoding.sketch3','appVersion':'100.3','build':165000,'created':{'commit':'local-generated-by-codex','appVersion':'100.3','build':165000,'app':'com.bohemiancoding.sketch3','compatibilityVersion':99,'version':150},'saveHistory':[],'fonts':['PingFang SC'],'pagesAndArtboards':{page_id:{'name':'小程序改稿','artboards':artboards}}}
(WORK/'meta.json').write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(WORK/'user.json').write_text(json.dumps({'document':{'pageListHeight':85,'pageListCollapsed':0},'pages':{page_id:{'scrollOrigin':'{0, 0}','zoomValue':0.22}}},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
if SKETCH.exists(): SKETCH.unlink()
with zipfile.ZipFile(SKETCH,'w',zipfile.ZIP_DEFLATED) as z:
    for f in WORK.rglob('*'):
        z.write(f,f.relative_to(WORK).as_posix())
print(str(SKETCH.resolve()))
print(SKETCH.stat().st_size)
