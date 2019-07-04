// 1.引入mongoose
// 2.连接数据库
// 3.监听是否连接成功
// 4.定义文档结构
// 5.创建特定集合，并向外暴露集合
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/ht', { useNewUrlParser: true })

const con = mongoose.connection
con.on('connected', function() {
  '数据库连接成功'
})

// 后台登陆管理者
const managerSchema = mongoose.Schema({
  username: { type: String, require: true },
  password: { type: String, require: true },
  name: { type: String } //别名
})

//banner管理

// belongChannel
// 1 首页
// 2 今日车闻
// 3 新能源
// 4 视频
// 5 兴趣部落
// banner模块

// state
// 0 草稿
// 1 发布
// 2审核中
// banner的模型
const bannerMangerSchema = mongoose.Schema({
  firstChannel: { type: String, require: true },
  secondChannel: { type: String },
  state: { type: Number, require: true },
  startTime: { type: String, require: true },
  endTime: { type: String, require: true },
  bannerName: { type: String, require: true },
  createTime: { type: String },
  updateTime: { type: String },
  bannerDescription: { type: String, require: true },
  bannerPic: { type: String },
  bannerLink: { type: String, require: true },
  channelName: { type: String, require: true }
})
//banner板块类型
const bannerChannelSchema = mongoose.Schema({
  bannerChannelList: [
    {
      channelId: { type: String, require: true },
      label: { type: 'String', require: true },
      children: [
        {
          channelId: { type: String, require: true }, //别名
          label: { type: 'String', require: true }
        }
      ]
    }
  ]
})
// 文章类型 1：原创 2：转载 3： 翻译 articleType: { type: String, require: true },
// 文章状态：0：下架 1： 发布 2： 草稿 3.审核中,4审核不通过state: { type: Number, require: true },
// 上架时间startTime: { type: String, require: true },
// 下架时间endTime: { type: String, require: true },
// 文章标题articleTtle: { type: String, require: true },
// 文章摘要articleDigest: { type: String },
// 创建时间createTime: { type: String },
// 更新时间updateTime: { type: String },
// 文章内容articleContent: { type: String },
// 文章封面图articlePic: { type: String, require: true },
// 文章视频articlVideo: {type: String},
// 文章作者id authorId: {type: String},
// 作者信息  authorMsg: {type: Object}
// 作者author: { type: String, require: true },
// 所属板块名字channelName: { type: String, require: true },
// 所属板块id
// 热门：hotState: {type: Boolean}
// 文章标签 articleTag
// 文章点击数 clickCount
// 是否是兴趣部落 isHobbies
// 文章评论内容 articleCommentList
//审核不通过原因
//文章管理
const articleMangerSchema = mongoose.Schema({
  articleType: { type: String, require: true },
  state: { type: Number, require: true },
  // startTime: { type: String, require: true },
  // endTime: { type: String, require: true }, 由必须改为非必需，兼容前台发表文章
  startTime: { type: String },
  endTime: { type: String },
  articleTitle: { type: String },
  articleDigest: { type: String },
  createTime: { type: String },
  updateTime: { type: String },
  articleContent: { type: String },
  articlePic: { type: String, require: true },
  picList: { type: Array }, // 如果是属于兴趣的就有这个属性
  articleVideo: { type: String },
  authorId: { type: String },
  authorMsg: { type: Object },
  author: { type: String, require: true },
  channelId: { type: String, require: true },
  channelName: { type: String, require: true },
  hotState: { type: Boolean },
  articleTag: { type: Array },
  clickCount: { type: Number },
  faildContent: { type: String },
  isHobbies: { type: Boolean, require: true },
  articleCommentList: { type: Array },
  authorAvatar: { type: String },
  secondChannel: { type: String },
  secondChannelName: { type: String }
})

// tagName tag名字
// state 0 下架 1发布
//channelId 板块id
//channelName 板块名字
// count 被点击次数

// tag管理
const tagSchema = mongoose.Schema({
  tagName: { type: String, require: true },
  state: { type: Number, require: true },
  channelId: { type: String, require: true },
  channelName: { type: String, require: true },
  createTime: { type: String, require: true },
  count: { type: Number, require: true }
})

// 前端用户管理
// account 账号
// paaword 密码
// authorId 作者id
// author 昵称
// authorAvatar用户头像
// articleList 文章列表
// articleCount 文章数
// fensCount 粉丝数
// fensList // 粉丝列表
// focusCount 关注数
// focusList // 我关注的博主
const userSchema = mongoose.Schema({
  account: {
    type: String,
    require: true
  },
  password: {
    type: String,
    require: true
  },
  author: {
    type: String,
    require: true
  },
  authorAvatar: {
    type: String
  },
  authorId: {
    type: String,
    require: true
  },
  articleList: {
    type: Array
  },
  articleCount: {
    type: Number
  },
  fensList: {
    type: Array
  },
  fensCount: {
    type: Number
  },
  focusList: {
    type: Array
  },
  focusCount: {
    type: Number
  },
  detailMessage: {
    type: Object
  },
  question: {
    type: String,
    require: true
  },
  answer: {
    type: String,
    require: true
  }
})
//专栏管理
// colcumnTitle 专栏标题
// state 发布状态
// channelId 板块id
// channelName 板块名字
// createTime 创建时间
const columnSchema = mongoose.Schema({
  columnTitle: { type: String, require: true },
  state: { type: Number, require: true },
  channelId: { type: String, require: true },
  channelName: { type: String, require: true },
  createTime: { type: String, require: true },
  picList: { type: Array }
})
//兴趣部落二级分类文档
// title 标题
// alphaTitle 英文标题
// state 状态 0 下架 1发布
// creatTime 创建时间
// updateTime 更新时间
//兴趣部落二级模块管理
const hobbiesChannelSchema = mongoose.Schema({
  channelTitle: { type: String, require: true },
  alphaTitle: { type: String, require: true },
  state: { type: Number, require: true },
  createTime: { type: String, require: true },
  updateTime: { type: String, require: true }
})
//兴趣部落文档
// channelId 分类id
// channelName 分类名
// content 文章内容
// channelTag 分类标签
// picList 图片数组
// video 视频地址  选择性填写
// createTiem 创建时间
// updateTiem 更新时间
// state 状态
// authorId 作者id
const hobbiesArticleSchema = mongoose.Schema({
  channelId: { type: String, require: true },
  channelName: { type: String, require: true },
  content: { type: String, require: true },
  channelTag: { type: Array, require: true },
  picList: { type: Array, require: true },
  video: { type: Array },
  createTime: { type: String, require: true },
  updateTime: { type: String, require: true },
  state: { type: Number, require: true },
  authorId: { type: String, require: true }
})

// 指定名字
const managerModel = mongoose.model('manager', managerSchema)
const bannerModel = mongoose.model('banner', bannerMangerSchema)
const bannerChannelListModel = mongoose.model(
  'bannerchannel',
  bannerChannelSchema
)
const articleModel = mongoose.model('article', articleMangerSchema)
const tagModel = mongoose.model('tag', tagSchema)
const columnModel = mongoose.model('colcumn', columnSchema)
const userModel = mongoose.model('user', userSchema)
const hobbiesChannelModel = mongoose.model(
  'hobbiesChannel',
  hobbiesChannelSchema
)
const hobbiesArticleModel = mongoose.model(
  'hobbiesArticle',
  hobbiesArticleSchema
)
// 两种暴露方式model.exports = xxx
// exports.xxx = xxx
exports.managerModel = managerModel
exports.bannerModel = bannerModel
exports.bannerChannelListModel = bannerChannelListModel
exports.articleModel = articleModel
exports.tagModel = tagModel
exports.columnModel = columnModel
exports.userModel = userModel
exports.hobbiesChannelModel = hobbiesChannelModel
exports.hobbiesArticleModel = hobbiesArticleModel
