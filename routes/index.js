var express = require('express')
var router = express.Router()
const filter = { password: 0, __v: 0 } // 过滤掉不必要的返回信息
const querystring = require('querystring')
const {
  managerModel,
  bannerChannelListModel,
  bannerModel,
  articleModel,
  tagModel,
  columnModel,
  userModel,
  hobbiesChannelModel,
  hobbiesArticleModel
} = require('../bin/models.js')
const md5 = require('blueimp-md5')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

// 注册操作
router.post('/ht/register', function(req, res) {
  let { username, password } = req.body
  // 数据是否存在
  managerModel.findOne({ username }, function(err, userdata) {
    if (userdata) {
      res.send({ code: 1, msg: '该用户已经被注册' })
    } else {
      // 新建保存,通过md5保密
      new managerModel({
        username,
        password: md5(password)
      }).save(function(err, userdata) {
        // 生成一个cookie, 实现自动登陆
        //res.cookie('userId', userdata._id, { maxAge: 1000 * 60 * 60 * 24 })
        let data = { username, _id: userdata._id }
        res.send({ code: 0, data })
      })
    }
  })
})
// 登陆操作
router.post('/ht/login', function(req, res) {
  const { username, password } = req.body
  managerModel.findOne({ username, password: md5(password) }, filter, function(
    err,
    data
  ) {
    if (data && !err) {
      // 生成一个cookie, 实现自动登陆
      // res.cookie('userId', userdata._id, { maxAge: 1000 * 60 * 60 * 24 })
      res.send({ code: 0, data: data })
    } else {
      res.send({ code: 1, des: '用户名或者密码不正确' })
    }
  })
})

// 生成bannerChannel(banner板块)的选择
router.get('/ht/bannerChannerlList', function(req, res) {
  // 查找
  bannerChannelListModel.find({}, function(err, data) {
    if (data) {
      res.send({ code: 0, data })
    } else {
      res.send({ code: 1, msg: '服务器发生错误' })
    }
  })
  // new bannerChannelListModel({
  //   bannerChannelList: [
  //     {
  //       value: '1',
  //       label: '首页',
  //       children: [
  //         {
  //           value: '11', //别名
  //           label: '首页-首页'
  //         },
  //         {
  //           value: '12', //别名
  //           label: '首页-今日车闻'
  //         },
  //         {
  //           value: '13', //别名
  //           label: '首页-新能源'
  //         },
  //         {
  //           value: '14', //别名
  //           label: '首页-兴趣部落'
  //         },
  //         {
  //           value: '15', //别名
  //           label: '首页-视频'
  //         }
  //       ]
  //     },
  //     {
  //       value: '2',
  //       label: '今日车闻'
  //     },
  //     {
  //       value: '3',
  //       label: '新能源'
  //     },
  //     {
  //       value: '4',
  //       label: '兴趣部落'
  //     },
  //     {
  //       value: '5',
  //       label: '视频'
  //     }
  //   ]
  // }).save(function(err, data) {
  //   // 生成一个cookie, 实现自动登陆
  //   //res.cookie('userId', userdata._id, { maxAge: 1000 * 60 * 60 * 24 })
  //   res.send({ code: 0, data })
  // })
})

//生成新banner
router.post('/ht/addBanner', function(req, res) {
  const {
    firstChannel,
    startTime,
    endTime,
    bannerName,
    bannerPic,
    bannerLink,
    bannerDescription,
    state
  } = req.body
  let obj = {
    firstChannel,
    startTime,
    endTime,
    bannerName,
    bannerPic,
    bannerLink,
    bannerDescription,
    state
  }
  if (req.body.secondChannel) {
    obj.secondChannel = req.body.secondChannel
  }
  let date = new Date()
  obj.createTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.channelName = getChannelName(firstChannel, obj.secondChannel)
  new bannerModel(obj).save(function(err, data) {
    if (!err) {
      res.send({ code: 0, data: { msg: '新增成功' } })
    } else {
      throw err
    }
  })
})

//更新banner
router.post('/ht/updateBanner', function(req, res) {
  const {
    firstChannel,
    startTime,
    endTime,
    bannerName,
    bannerPic,
    bannerLink,
    bannerDescription,
    state,
    _id
  } = req.body
  let obj = {
    firstChannel,
    startTime,
    endTime,
    bannerName,
    bannerPic,
    bannerLink,
    bannerDescription,
    state
  }
  if (req.body.secondChannel) {
    obj.secondChannel = req.body.secondChannel
  }
  let date = new Date()
  console.log(req.body)
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.channelName = getChannelName(firstChannel, obj.secondChannel)
  bannerModel.findOne({ _id }, function(err, oldData) {
    if (!err) {
      let temp = Object.assign(oldData, obj)
      bannerModel.findOneAndUpdate({ _id }, temp, function(err, data) {
        if (!err) {
          res.send({ code: 0, data: { msg: '修改成功' } })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
// 上下架banner
router.post('/ht/upOrDownBanner', function(req, res) {
  let _id = req.query.id
  let state = req.query.state
  bannerModel.findOne({ _id }, function(err, data) {
    if (err) {
      throw err
    }
    bannerModel.findOneAndUpdate({ _id }, { ...data, state }, function(
      err,
      data
    ) {
      if (!err) {
        res.send({ code: 0, data: { msg: '修改成功' } })
      } else {
        throw err
      }
    })
  })
})
// 返回板块名字名字
function getChannelName(channelId, secondId) {
  switch (parseInt(channelId)) {
    case 1: {
      if (parseInt(secondId) == 11) {
        return '首页-首页'
      } else if (secondId == 12) {
        return '首页-今日车闻'
      } else if (secondId == 13) {
        return '首页-新能源'
      }
      // else if (secondId == 14) {
      //   return '首页-兴趣部落'
      // }
      else {
        return '首页-视频'
      }
    }
    case 2: {
      return '今日车闻'
    }
    case 3: {
      return '新能源'
    }
    case 4: {
      return '视频'
    }

    default: {
      return '兴趣部落'
    }
    // case 4: {
    //   return '视频'
    // }
    // default: {
    //   return '兴趣部落'
    // }
  }
}
//删除banner
router.delete('/ht/deleteBanner', function(req, res) {
  let { _id } = req.body
  bannerModel.deleteOne({ _id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '删除成功' })
    } else {
      throw err
    }
  })
})

//查询banner列表
router.get('/ht/bannerList', function(req, res) {
  // 处理查询参数
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let page = params.page
  let limit = parseInt(params.limit)
  let totalCount
  let allPage
  bannerModel.find({}, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = bannerModel
    .find({})
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage })
      }
    })
})
//单个banner详情
router.get('/ht/getBannerDetail', function(req, res) {
  // var pathname = url.parse(request.query).pathname
  let { id } = req.query
  bannerModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, data })
    } else {
      throw err
    }
  })
})
// 查询各个板块的banner列表
router.get('/web/getBannerList', function(req, res) {
  if (req.query.secondChannel) {
    // 首页各个轮播图
    bannerModel.find(
      { secondChannel: req.query.secondChannel },
      { bannerName: 1, bannerPic: 1, bannerLink: 1 },
      function(err, data) {
        if (!err) {
          res.send({ code: 0, data: data })
        } else {
          throw err
        }
      }
    )
  } else {
    // 其他页轮播图
    bannerModel.find({ firstChannel: req.query.firstChannel }, function(
      err,
      data
    ) {
      if (!err) {
        res.send({ code: 0, data: data })
      } else {
        throw err
      }
    })
  }
})
// 文章管理

//新增文章
router.post('/ht/addArticle', function(req, res) {
  let {
    articleType,
    state,
    startTime,
    endTime,
    articleTitle,
    articlePic,
    author,
    channelId
  } = req.body
  let obj = {
    articleType,
    state,
    startTime,
    endTime,
    articleTitle,
    articlePic,
    author,
    channelId,
    clickCount: 0
  }
  if (req.body.articleDigest) {
    obj.articleDigest = req.body.articleDigest
  }
  if (req.body.articleContent) {
    obj.articleContent = req.body.articleContent
  }
  if (req.body.articleVideo) {
    obj.articleVideo = req.body.articleVideo
  }
  if (req.body.authoreId) {
    obj.authorId = req.body.authorId
  }
  obj.hotState = false // 默认为不热门
  obj.isHobbies = false
  let date = new Date()
  obj.createTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.channelName = getChannelName(channelId)
  if (req.body.articleTag) {
    let tagList = req.body.articleTag.split(',')
    obj.articleTag = tagList.length > 0 ? tagList : [req.body.articleTag]
    obj.articleTag
    for (let i = 0; i < obj.articleTag.length; i++) {
      let tagObj = {
        state: obj.state,
        channelId: channelId,
        tagName: obj.articleTag[i],
        createTime: obj.createTime
      }
      tagObj.channelName = obj.channelName
      tagObj.count = 0
      tagModel.find(
        { tagName: tagObj.tagName, channelId: tagObj.channelId },
        function(err, data) {
          if (!err) {
            if (data.length > 0) {
            } else {
              new tagModel(tagObj).save(function(err, data) {
                if (err) {
                  throw err
                }
              })
            }
          } else {
            throw err
          }
        }
      )
    }
    new articleModel(obj).save(function(err, data) {
      if (!err) {
        res.send({ code: 0, msg: '新增成功' })
      }
    })
  } else {
    new articleModel(obj).save(function(err, data) {
      if (!err) {
        res.send({ code: 0, msg: '新增成功' })
      }
    })
  }
})
//更新文章
router.post('/ht/updateArticle', function(req, res) {
  let {
    articleType,
    state,
    startTime,
    endTime,
    articleTitle,
    articlePic,
    author,
    channelId
  } = req.body
  let obj = {
    articleType,
    state,
    startTime,
    endTime,
    articleTitle,
    articlePic,
    author
  }
  if (req.body.articleDigest) {
    obj.articleDigest = req.body.articleDigest
  }
  if (req.body.articleContent) {
    obj.articleContent = req.body.articleContent
  }
  if (req.body.articlVideo) {
    obj.articlVideo = req.body.articlVideo
  }
  if (req.body.authoreId) {
    obj.authoreId = req.body.authoreId
  }
  if (req.body.hotState) {
    obj.hotState = req.body.hotState
  }
  if (req.body.articleTag) {
    obj.tagList = req.body.articleTag
  }
  let date = new Date()
  let id = req.body._id
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.channelName = getChannelName(channelId)
  articleModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      articleModel.findOneAndUpdate(
        { _id: id },
        { ...obj, clickCount: data.clickCount },
        function(err, data) {
          if (!err) {
            res.send({ code: 0, msg: '修改成功' })
          } else {
            throw err
          }
        }
      )
    }
  })
})
//查询tag需要 {intro:{$elemMatch:{$eq:"搞"}}}
//删除文章
router.delete('/ht/deleteArticle', function(req, res) {
  let _id = req.body._id
  articleModel.deleteOne({ _id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '删除成功' })
    } else {
      throw err
    }
  })
})
// 上架文章
router.get('/ht/UpOrDownArticle', function(req, res) {
  let id = req.query._id
  let state = req.query.state
  articleModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      data.state = state
      articleModel.findOneAndUpdate({ _id: id }, data, function(err, data) {
        if (!err) {
          res.send({ code: 0, msg: '设置热点文章成功' })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
// 设置板块热点文章
router.get('/ht/hotArticle', function(req, res) {
  let id = req.query.id
  let hotState = req.query.hotState
  articleModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      data.hotState = hotState
      articleModel.findOneAndUpdate({ _id: id }, data, function(err, data) {
        if (!err) {
          res.send({ code: 0, msg: '设置热点文章成功' })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
// 获取热点咨询文章 也就是点击量最多的文章
router.get('/web/hotArticleList', function(req, res) {
  articleModel
    .find({ state: 1, isHobbies: false })
    .limit(6)
    .sort({ clickCount: -1 })
    .exec(function(err, hotList) {
      if (!err) {
        let tempList = hotList.slice(0, 7)

        res.send({ code: 0, data: tempList })
      }
    })
})
// 文章审核
router.post('/ht/auditArticle', function(req, res) {
  let { _id, state } = req.body
  articleModel.findOne({ _id }, function(err, data) {
    if (!err) {
      //  审核不通过的文章，添加审核原因
      if (req.body.faildContent) {
        console.log(req.body.faildContent, data)
        data.faildContent = req.body.faildContent
      } else {
        // 审核通过，删除审核不通过原因
        delete data.faildContent
      }
      data.state = state
      articleModel.findOneAndUpdate({ _id }, data, function(err, data) {
        if (!err) {
          res.send({ code: 0, msg: '修改成功' })
        } else {
          throw err
        }
      })
    }
  })
})
// 后台获取文章列表
router.get('/ht/articleList', function(req, res) {
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let page = params.page
  let limit = parseInt(params.limit)
  let channelId = params.channelId ? params.channelId : 0
  let totalCount
  let allPage
  let obj = {}
  if (!!channelId) {
    obj.channelId = channelId
  }
  obj.isHobbies = false
  console.log(obj)
  articleModel.find(obj, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
      articleModel
        .find(obj)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(function(err, data) {
          if (!err) {
            res.send({ list: data, totalCount, allPage })
          }
        })
    } else {
      throw err
    }
  })
})
// 获取首页今日车闻随机列表
router.get('/web/getIndexNewsArticleList', function(req, res) {
  articleModel
    .find({ channelId: '2', state: 1 })
    .limit(8)
    .exec(function(err, data) {
      if (!err) {
        let temp = randomArr(data)
        res.send({ code: 0, data: temp })
      }
    })
})
// 获取板块热点文章
router.get('/web/channelHotArticleList', function(req, res) {
  let { channelId } = req.query
  let limit = req.query.limit ? parseInt(req.query.limit) : 3
  articleModel
    .find({ channelId, hotState: true })
    .limit(limit)
    .exec(function(err, articleList) {
      if (!err) {
        console.log('articlelist', channelId)
        articleList.map(article => {
          userModel.findOne(
            { authorId: article.authorId },
            { password: 0 },
            function(err, oldValue) {
              if (!err) {
                let newArticle = Object.assign(article, { authorMsg: oldValue })

                articleModel.findOneAndUpdate(
                  { authorId: article.authorId },
                  newArticle,
                  function(err, da) {
                    console.log(da)
                  }
                )
              } else {
                throw err
              }
            }
          )
        })
        res.send({ code: 0, data: articleList })
      } else {
        throw err
      }
    })
})
// 后台获取文章详情/兴趣部落详情
router.get('/ht/getArticleDetail', function(req, res) {
  // var pathname = url.parse(request.query).pathname
  let { id } = req.query
  articleModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, data })
    } else {
      throw err
    }
  })
})
// 前台获取各个板块的文章
router.get('/web/getChannelArticleList', function(req, res) {
  let { channelId, page } = req.query
  page = parseInt(page)
  let limit = 12
  articleModel.find({ channelId }, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = articleModel
    .find({ channelId })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage })
      }
    })
})
// 前台获取文章详情, 文章点击量加1
router.get('/web/getArticleDetail', function(req, res) {
  // var pathname = url.parse(request.query).pathname
  let { id } = req.query
  articleModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      data.clickCount = data.clickCount + 1
      userModel.find(
        { authorId: data.authorId },
        {
          password: 0,
          account: 0,
          _v: 0,
          fensList: 0,
          focusList: 0,
          articleList: 0
        },
        function(err, user) {
          if (!err) {
            articleModel.findOneAndUpdate(
              { _id: id },
              { $set: { authorMsg: user, clickCount: data.clickCount } },
              function(err, data) {
                if (!err) {
                  res.send({ code: 0, data })
                } else {
                  throw err
                }
              }
            )
          } else {
          }
        }
      )
    } else {
      throw err
    }
  })
})
// 获取tagList
router.get('/ht/tagList', function(req, res) {
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let page = params.page
  let limit = parseInt(params.limit)
  let totalCount
  let allPage
  tagModel.find({}, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = tagModel
    .find({})
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage })
      }
    })
})
//新增tag
router.post('/ht/addTag', function(req, res) {
  let { tagName, state, channelId } = req.body
  let obj = { tagName, state, channelId }
  let date = new Date()
  obj.createTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.count = 0
  let name = getChannelName(channelId)
  if (name.indexOf('首页') != -1) {
    obj.channelName = '首页'
  } else {
    obj.channelName = name
  }
  new tagModel(obj).save(function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '新增成功' })
    } else {
      throw err
    }
  })
})
//更新tag
router.post('/ht/updateTag', function(req, res) {
  let { tagName, state, channelId, _id } = req.body
  let obj = { tagName, state, channelId }
  let name = getChannelName(channelId)
  if (name.indexOf('首页') != -1) {
    obj.channelName = '首页'
  } else {
    obj.channelName = name
  }
  tagModel.findOne({ _id }, function(err, data) {
    if (!err) {
      obj.count = data.count
      tagModel.findOneAndUpdate({ _id }, obj, function(err, data) {
        if (!err) {
          articleModel.updateMany(
            { articleTag: { $elemMatch: { $eq: data.tagName } } },
            { $set: { articleTag: tagName } },
            function(err, data) {
              if (err) {
                throw err
              }
            }
          )
          res.send({ code: 0, msg: '修改成功' })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
//tag点击量增加
router.get('/ht/tagCountUp', function(req, res) {
  let { _id } = req.query
  tagModel.findOne({ _id }, function(err, data) {
    if (!err) {
      data.count = data.count + 1
      tagModel.findOneAndUpdate({ _id }, data, function(err, data) {
        if (!err) {
          res.send({ code: 0, msg: '修改成功' })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
// 获取tag详情
router.get('/ht/getTagDetail', function(req, res) {
  // var pathname = url.parse(request.query).pathname
  let id = req.query.id
  tagModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, data })
    } else {
      throw err
    }
  })
})
// 获取点击量最多的tag
router.get('/web/getHotTagList', function(req, res) {
  tagModel
    .find({})
    .sort({ count: -1 })
    .limit(10)
    .exec(function(err, hotTagist) {
      if (!err) {
        res.send({ code: 0, data: hotTagist })
      }
    })
})
//删除tag
router.delete('/ht/deleteTag', function(req, res) {
  let { _id } = req.body
  tagModel.deleteOne({ _id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '删除成功' })
    } else {
      throw err
    }
  })
})

// 获取专栏列表
router.get('/ht/columnList', function(req, res) {
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let page = params.page
  let limit = parseInt(params.limit)
  let totalCount
  let allPage
  columnModel.find({}, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = columnModel
    .find({})
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage })
      }
    })
})
// 新建专栏
router.post('/ht/addColumn', function(req, res) {
  let { columnTitle, state, channelId, picList } = req.body
  let obj = { columnTitle, state, channelId, picList }
  let date = new Date()
  obj.createTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.channelName = getChannelName(channelId)
  new columnModel(obj).save(function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '新增成功', data })
    } else {
      throw err
    }
  })
})
// 更新专栏
router.post('/ht/updateColumn', function(req, res) {
  let { columnTitle, state, channelId, picList, _id } = req.body
  let obj = { columnTitle, state, channelId, picList }
  obj.channelName = getChannelName(channelId)
  columnModel.findOne({ _id }, function(err, data) {
    if (!err) {
      columnModel.findOneAndUpdate({ _id }, { data, ...obj }, function(
        err,
        data
      ) {
        if (!err) {
          res.send({ code: 0, msg: '修改成功' })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
// 删除专栏
router.delete('/ht/deleteColumn', function(req, res) {
  let _id = req.body._id
  columnModel.deleteOne({ _id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '删除成功' })
    } else {
      throw err
    }
  })
})
// 获取专栏详情
router.get('/ht/getColumnDetail', function(req, res) {
  let id = req.query.id
  columnModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, data })
    } else {
      throw err
    }
  })
})
// 根据板块获取专栏列表
router.post('/web/getColumnList', function(req, res) {
  let { channelId } = req.body
  columnModel.find({ channelId }).exec(function(err, data) {
    if (!err) {
      res.send({ code: 0, data })
    }
  })
})
//兴趣部落二级频道分类列表
router.get('/ht/hobbiesChannelList', function(req, res) {
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let page = params.page
  let limit = parseInt(params.limit)
  let totalCount
  let allPage
  hobbiesChannelModel.find({}, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = hobbiesChannelModel
    .find({})
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage })
      }
    })
})
//新增二级频道分类
router.post('/ht/addHobbiesChannel', function(req, res) {
  let { channelTitle, state, alphaTitle } = req.body
  let obj = { channelTitle, state, alphaTitle }
  let date = new Date()
  let time = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.createTime = time
  obj.updateTime = time
  console.log(obj)
  new hobbiesChannelModel(obj).save(function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '新增成功', data })
    } else {
      throw err
    }
  })
})
//更新二级频道分类
router.post('/ht/updateHobbiesChannel', function(req, res) {
  let { _id, channelTitle, state, alphaTitle } = req.body
  let obj = { channelTitle, state, alphaTitle }
  let date = new Date()
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  hobbiesChannelModel.findOne({ _id }, function(err, oldObj) {
    if (!err) {
      let temp = Object.assign(oldObj, obj)
      console.log(temp)
      hobbiesChannelModel.findOneAndUpdate({ _id }, temp, function(
        err,
        newValue
      ) {
        console.log(newValue)
        if (!err) {
          res.send({ code: 0, msg: '更新成功' })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
//获取分类详情
router.get('/ht/getHobbiesChannelDetail', function(req, res) {
  let { id } = req.query
  console.log(id)
  hobbiesChannelModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, data })
    } else {
      throw err
    }
  })
})
//删除二级频道分类
router.delete('/ht/deleteHobbiesChannel', function(req, res) {
  let { _id } = req.body
  hobbiesChannelModel.findOneAndDelete({ _id }, function(err, data) {
    if (!err) {
      res.send({ code: 0, msg: '删除成功' })
    } else {
      throw err
    }
  })
})

//获取前端用户列表
router.get('/ht/userList', function(req, res) {
  // 处理查询参数
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let page = params.page
  let limit = parseInt(params.limit)
  let totalCount
  let allPage
  userModel.find({}, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = userModel
    .find({})
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage })
      }
    })
})

//后台查询用户详情
router.get('/ht/getUserDetail', function(req, res) {
  // var pathname = url.parse(request.query).pathname
  let { authorId } = req.query
  userModel.findOne({ authorId }, function(err, data) {
    if (!err) {
      console.log(data)
      res.send({ code: 0, data })
    } else {
      throw err
    }
  })
})
//后台更新用户信息
router.post('/ht/updateUserMsg', function(req, res) {
  let { authorId, fensCount, focusCount, detailMessage } = req.body
  userModel.findOneAndUpdate(
    { authorId },
    { $set: { fensCount, focusCount, detailMessage } },
    function(err, data) {
      res.send({ code: 0, data: { msg: '修改成功' } })
    }
  )
})

// 前端用户注册
router.post('/web/userRegister', function(req, res) {
  let { account, password, author, question, answer } = req.body
  userModel.find({ account }, function(err, data) {
    if (!err) {
      if (data.length > 0) {
        res.send({ code: 1, msg: '该用户已经被注册' })
      } else {
        let obj = {
          account,
          authorId: uuid(), // 独一无二的id
          password: md5(password),
          author,
          articleList: [],
          articleCount: 0,
          fensList: [],
          fensCount: 0,
          focusList: [],
          focusCount: 0,
          question,
          answer,
          detailMessage: { level: 0 }
        }
        new userModel(obj).save(function(err, data) {
          if (!err) {
            res.send({ code: 0, msg: '注册成功' })
          } else {
            throw err
          }
        })
      }
    } else {
      throw err
    }
  })
})
// 后台获取兴趣部落文章列表
router.get('/ht/getHobbiesArticleList', function(req, res) {
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let page = params.page
  let limit = parseInt(params.limit)
  let totalCount
  let allPage
  articleModel.find({ isHobbies: true }, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = articleModel
    .find({ isHobbies: true })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage })
      }
    })
})

//-------------------------------------------------------------------------------------------------

// 前端用户登陆
router.post('/web/userLogin', function(req, res) {
  let { account, password } = req.body
  console.log(md5(password))
  userModel.find(
    { account, password: md5(password) },
    { password: 0, _v: 0 },
    function(err, data) {
      if (!err) {
        console.log(data)
        if (data.length > 0) {
          res.send({ code: 0, data: data })
        } else {
          res.send({ code: 1, msg: '账号或密码错误' })
        }
      } else {
        throw err
      }
    }
  )
})
// 获取前端用户头像和昵称
router.post('/web/getUserMsg', function(req, res) {
  let { authorId } = req.body
  userModel.findOne({ authorId }, { author: 1, authorAvater: 1 }, function(
    err,
    data
  ) {
    if (!err) {
      // 返回头像和昵称
      res.send({ code: 0, data: data })
    } else {
      throw err
    }
  })
})
// 获取前端用户详细信息 文章数，粉丝数，关注数
router.get('/web/getUserDetailMsg', function(req, res) {
  let { authorId } = req.query
  userModel.findOne(
    { authorId },
    { articleList: 0, password: 0, _v: 0 },
    function(err, data) {
      if (!err) {
        // 返回头像和昵称
        res.send({ code: 0, data: data })
      } else {
        throw err
      }
    }
  )
})
//前台新增文章
router.post('/web/addArticle', function(req, res) {
  let {
    articleType,
    state, // 发表为审核状态3,状态2为草稿
    articleTitle,
    articlePic,
    author,
    channelId,
    authorId, //作者id
    articleDigest, // 文章摘要
    articleContent // 文章内容
  } = req.body
  let obj = {
    state,
    articleType,
    articleTitle,
    articlePic,
    author,
    channelId,
    clickCount: 0, //初始点击次数
    authorId, //作者id
    articleDigest, // 文章摘要
    articleContent // 文章内容
  }
  // 文章视频附件
  if (req.body.articleVideo) {
    obj.articleVideo = req.body.articleVideo
  }
  // 作者id
  if (req.body.authoreId) {
    obj.authorId = req.body.authorId
  }
  obj.hotState = false // 默认为不热门
  let date = new Date()
  obj.createTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.channelName = getChannelName(channelId)
  obj.isHobbies = false
  // 标签
  if (req.body.articleTag) {
    let tagList = req.body.articleTag.split(',')
    obj.articleTag = tagList.length > 0 ? tagList : [req.body.articleTag]
    // obj.articleTag

    for (let i = 0; i < obj.articleTag.length; i++) {
      let tagObj = {
        state: obj.state,
        channelId: channelId,
        tagName: obj.articleTag[i],
        createTime: obj.createTime
      }
      tagObj.channelName = obj.channelName
      tagObj.count = 0
      tagModel.find(
        { tagName: tagObj.tagName, channelId: tagObj.channelId },
        function(err, data) {
          if (!err) {
            if (data.length > 0) {
            } else {
              new tagModel(tagObj).save(function(err, data) {
                if (err) {
                  throw err
                }
              })
            }
          } else {
            throw err
          }
        }
      )
    }
    new articleModel(obj).save(function(err, article) {
      if (!err) {
        userModel.findOne({ authorId }, function(err, oldObj) {
          if (!err) {
            // 将文章的id，存进作者文章列表中
            oldObj.articleList.unshift(article._id)
            oldObj.articleCount = oldObj.articleCount + 1
            // 更新当前作者信息
            userModel.findOneAndUpdate({ authorId }, oldObj, function(
              err,
              newObj
            ) {
              if (!err) {
                res.send({ code: 0, msg: '文章新增成功，等待审核通过' })
              }
            })
          } else {
            throw err
          }
        })
      }
    })
  }
  //前台发表文章不填tag
  else {
    new articleModel(obj).save(function(err, article) {
      if (!err) {
        userModel.findOne({ authorId }, function(err, oldObj) {
          if (!err) {
            // 将文章的id，存进作者文章列表中
            console.log(2222222222222, oldObj)
            oldObj.articleList.unshift(article._id)
            oldObj.articleCount = oldObj.articleCount + 1
            // 更新当前作者信息
            userModel.findOneAndUpdate({ authorId }, oldObj, function(
              err,
              newObj
            ) {
              if (!err) {
                res.send({ code: 0, msg: '文章新增成功，等待审核通过' })
              }
            })
          } else {
            throw err
          }
        })
      }
    })
  }
})
//前台更新文章
router.post('/web/updateArticle', function(req, res) {
  let {
    articleType,
    state, // 发表为审核状态3,状态2为草稿
    articleTitle,
    articlePic,
    author,
    channelId,
    authorId, //作者id
    articleDigest, // 文章摘要
    articleContent // 文章内容
  } = req.body
  let obj = {
    state,
    articleType,
    articleTitle,
    articlePic,
    author,
    channelId,
    clickCount: 0, //初始点击次数
    authorId, //作者id
    articleDigest, // 文章摘要
    articleContent // 文章内容
  }
  if (req.body.secondChannel) {
    obj.secondChannel = req.body.secondChannel
  }
  if (req.body.secondChannelName) {
    obj.secondChannelName = req.body.secondChannelName
  }
  // 文章视频附件
  if (req.body.articleVideo) {
    obj.articleVideo = req.body.articleVideo
  }
  // 作者id
  if (req.body.authoreId) {
    obj.authorId = req.body.authorId
  }
  let date = new Date()
  let id = req.body._id
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.channelName = getChannelName(channelId)
  console.log(obj)
  articleModel.findOne({ _id: id }, function(err, data) {
    if (!err) {
      obj.clickCount = data.clickCount
      articleModel.findOneAndUpdate({ _id: id }, obj, function(err, data) {
        if (!err) {
          res.send({ code: 0, msg: '修改成功' })
        } else {
          throw err
        }
      })
    }
  })
})
//前台获取文章列表
router.get('/web/articleList', function(req, res) {
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let authorId = params.authorId
  console.log(authorId)
  let page = parseInt(params.page)
  let totalCount
  let allPage
  articleModel.find({ authorId: authorId }, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / 9)
    } else {
      throw err
    }
  })
  let query = articleModel
    .find({ authorId: authorId })
    .skip((page - 1) * 9)
    .limit(9)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage, currentPage: page })
      }
    })
})

//前端用户发表兴趣部落
router.post('/web/addHobbiesArticle', function(req, res) {
  let {
    channelId,
    picList,
    articleContent,
    articlePic,
    state,
    author,
    authorId,
    channelName,
    secondChannel,
    secondChannelId
  } = req.body
  let obj = {
    channelId,
    authorId,
    picList,
    articleContent,
    articlePic,
    state,
    author,
    channelName,
    isHobbies: true,
    secondChannel,
    secondChannelId
  }
  if (req.body.articlVideo) {
    obj.articlVideo = req.body.articlVideo
  }
  let date = new Date()
  obj.hotState = false
  obj.clickCount = 0
  obj.createTime = date.Format('yyyy-MM-dd hh:mm:ss')
  obj.updateTime = date.Format('yyyy-MM-dd hh:mm:ss')
  if (req.body.articleTag) {
    let tagList = req.body.articleTag.split(',')
    obj.articleTag = tagList.length > 0 ? tagList : [req.body.articleTag]
    // obj.articleTag

    for (let i = 0; i < obj.articleTag.length; i++) {
      let tagObj = {
        state: obj.state,
        channelId: '5',
        tagName: obj.articleTag[i],
        createTime: obj.createTime
      }
      tagObj.channelName = '兴趣部落'
      tagObj.count = 0
      tagModel.find(
        { tagName: tagObj.tagName, channelId: tagObj.channelId },
        function(err, data) {
          if (!err) {
            if (data.length > 0) {
            } else {
              new tagModel(tagObj).save(function(err, data) {
                if (err) {
                  throw err
                }
              })
            }
          } else {
            throw err
          }
        }
      )
    }
    new articleModel(obj).save(function(err, article) {
      if (!err) {
        userModel.findOne({ authorId }, function(err, oldObj) {
          if (!err) {
            // 将文章的id，存进作者文章列表中
            console.log(oldObj)
            oldObj.articleList.unshift(article._id)
            oldObj.articleCount = oldObj.articleCount + 1
            // 更新当前作者信息
            userModel.findOneAndUpdate({ authorId }, oldObj, function(
              err,
              newObj
            ) {
              if (!err) {
                res.send({ code: 0, msg: '文章新增成功，等待审核通过' })
              }
            })
          } else {
            throw err
          }
        })
      }
    })
  }
  // 没有填写标签
  else {
    new articleModel(obj).save(function(err, article) {
      if (!err) {
        userModel.findOne({ authorId }, function(err, oldObj) {
          if (!err) {
            // 将文章的id，存进作者文章列表中
            console.log(oldObj)
            oldObj.articleList.unshift(article._id)
            oldObj.articleCount = oldObj.articleCount + 1
            // 更新当前作者信息
            userModel.findOneAndUpdate({ authorId }, oldObj, function(
              err,
              newObj
            ) {
              if (!err) {
                res.send({ code: 0, msg: '文章新增成功，等待审核通过' })
              }
            })
          } else {
            throw err
          }
        })
      }
    })
  }
})

// 后端审核用户发表的兴趣部落，只修改兴趣部落文章的状态和审核不通过的描述
router.post('/ht/auditHobbiesArticle', function(req, res) {
  let { _id, state } = req.body
  articleModel.findOne({ _id, isHobbies: true }, function(err, data) {
    if (!err) {
      //  审核不通过的文章，添加审核原因
      if (req.body.faildContent) {
        console.log(req.body.faildContent, data)
        data.faildContent = req.body.faildContent
      } else {
        // 审核通过，删除审核不通过原因
        delete data.faildContent
      }
      data.state = state
      articleModel.findOneAndUpdate({ _id }, data, function(err, data) {
        if (!err) {
          res.send({ code: 0, msg: '修改成功' })
        } else {
          throw err
        }
      })
    }
  })
})

//前台获取各板块Tag
router.get('/web/getChannelTag', function(req, res) {
  let { channelId } = req.query
  tagModel
    .find({ channelId })
    .limit(10)
    .sort({ count: -1 })
    .exec(function(err, tagList) {
      if (!err) {
        res.send({ code: 0, data: tagList })
      } else {
        throw err
      }
    })
})

// 前台获取兴趣部落板块分类
router.get('/web/getHobbiesChannel', function(req, res) {
  hobbiesChannelModel.find({}, function(err, channelList) {
    if (!err) {
      res.send({ code: 0, channelList })
    } else {
      throw err
    }
  })
})
//前端用户更新
//上传图片
const formidable = require('formidable')
const util = require('util')
const uuid = require('uuid/v1') // 独一无二的表示
const path = require('path')
const fs = require('fs')
// 获取博主的相关文章
router.post('/web/getBlogerSimilarArticle', function(req, res) {
  let { authorId } = req.body
  articleModel
    .find({ authorId, state: 1 })
    .limit(8)
    .exec(function(err, articleList) {
      if (!err) {
        res.send({ code: 0, data: articleList })
      } else {
        throw err
      }
    })
})
// 将博主文章排序，取出最热门的八个
router.post('/web/getBlogerHotestArticle', function(req, res) {
  let { authorId } = req.body
  articleModel
    .find({ authorId, state: 1 })
    .sort({ clickCount: -1 })
    .limit(6)
    .exec(function(err, articleList) {
      if (!err) {
        res.send({ code: 0, data: articleList })
      } else {
        throw err
      }
    })
})
// 随机取八篇文章
router.get('/web/getRandomArticle', function(req, res) {
  articleModel.find({ state: 1 }).exec(function(err, articleList) {
    if (!err) {
      let tempList = randomArr(articleList).slice(0, 6)
      res.send({ code: 0, data: tempList })
    } else {
      throw err
    }
  })
})
//前端用户关注保存用户信息
router.post('/web/focusBloger', function(req, res) {
  let { _id, author, authorId, isFocus } = req.body.params
  let obj = {
    author,
    authorId
  }
  if (req.body.articleAvatar) {
    obj.authorAvatar = req.body.articleAvatar
  }
  // 关注博主
  if (isFocus) {
    userModel.findOne({ authorId: _id }, function(err, oldUser) {
      if (!err) {
        oldUser.focusList.push(obj)
        //更新被关注人的信息

        userModel.findOne({ authorId }, function(err, wereFocus) {
          wereFocus.fensList.push({
            authorId: oldUser.authorId,
            author: oldUser.author
          })
          wereFocus.fensCount++
          userModel.findOneAndUpdate({ authorId }, wereFocus, function(
            err,
            wereNewUser
          ) {
            if (!err) {
            } else {
              throw err
            }
          })
        })
        // 更新博主里面的关注列表
        oldUser.focusCount++
        userModel.findOneAndUpdate({ authorId: _id }, oldUser, function(
          err,
          newUser
        ) {
          if (!err) {
            console.log(newUser.focusList)
            res.send({ code: 0, msg: '关注成功' })
          } else {
            throw err
          }
        })
      }
    })
    // 取消关注博主
  } else {
    userModel.findOne({ authorId: _id }, function(err, oldUser) {
      if (!err) {
        userModel.findOne({ authorId }, function(err, wereUser) {
          if (!err) {
            //更新被关注博主的粉丝信息
            let index = wereUser.fensList.findIndex(item => {
              item.authorId == wereUser.authorId
            })
            wereUser.fensList.splice(index, 1)
            wereUser.fensCount--
            userModel.findOneAndUpdate({ authorId }, wereUser, function(
              err,
              newUser
            ) {
              if (!err) {
              } else {
                throw err
              }
            })
          }
        })
        //更新博主信息列表
        let index = oldUser.focusList.findIndex(item => {
          item.authorId == oldUser.authorId
        })
        oldUser.focusList.splice(index, 1)
        oldUser.focusCount--
        userModel.findOneAndUpdate({ authorId: _id }, oldUser, function(
          err,
          newUser
        ) {
          if (!err) {
            res.send({ code: 0, msg: '取消关注成功' })
          } else {
            throw err
          }
        })
      }
    })
  }
})
//前端获取兴趣部落最热和最新文章接口
router.get('/web/hobbiesHotOrLatesArticleList', function(req, res) {
  let isHot = req.query.isHot
  let limit = 8
  let page = req.query.page ? req.query.page : 1
  let sortObj = isHot ? { createTime: -1 } : { clickCount: -1 }
  let totalCount
  let allPage
  articleModel.find({ isHobbies: true }, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / limit)
    } else {
      throw err
    }
  })
  let query = articleModel
    .find({ isHobbies: true })
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .exec(function(err, articleList) {
      if (!err) {
        res.send({ code: 0, data: articleList, totalCount, allPage })
      }
    })
})
// 获取热门博主信息
router.get('/web/hotBloger', function(req, res) {
  userModel
    .find({}, { password: 0, account: 0 })
    .sort({ fensCount: -1 })
    .limit(10)
    .exec(function(err, blogerList) {
      if (!err) {
        res.send({ code: 0, data: blogerList })
      } else {
        throw err
      }
    })
})
// 获取热门博主加当前博主最热的信息
router.get('/web/hotBlogerAndArticle', function(req, res) {
  let page = req.body.page
  let allPage, totalCount
  userModel.find({ articleCount: { $ne: 0 } }, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / 10)
    } else {
      throw err
    }
  })
  let query = userModel
    .find({ articleCount: { $ne: 0 } }, { password: 0, account: 0 })
    .sort({ fensCount: -1 })
    .skip((page - 1) * 10)
    .limit(10)
    .exec(function(err, blogerList) {
      if (!err) {
        res.send({ code: 0, data: blogerList, allPage })
      } else {
        throw err
      }
    })
})
// 获取热门博主当前点击量最多的文章
router.get('/web/hotBlogerArticle', function(req, res) {
  let authorId = req.query.authorId
  articleModel
    .findOne({ authorId })
    .sort({ clickCount: -1 })
    .exec(function(err, article) {
      if (!err) {
        res.send({ code: 0, data: article })
      } else {
        throw err
      }
    })
})
//获取当前博主的通过审核的文章
router.get('/web/getBlogerArticleList', function(req, res) {
  let index = req.url.indexOf('?') + 1
  let params = querystring.parse(req.url.slice(index))
  let authorId = params.authorId
  console.log(authorId)
  let page = parseInt(params.page)
  let totalCount
  let allPage
  articleModel.find({ authorId: authorId, state: 1 }, function(err, data) {
    if (!err) {
      totalCount = data.length
      allPage = Math.ceil(totalCount / 9)
    } else {
      throw err
    }
  })
  console.log(page)
  let query = articleModel
    .find({ authorId: authorId, state: 1 })
    .skip((page - 1) * 9)
    .limit(9)
    .exec(function(err, data) {
      if (!err) {
        res.send({ list: data, totalCount, allPage, currentPage: page })
      }
    })
})
// 前台文章评论
router.post('/web/publishArticleComment', function(req, res) {
  // 当前文章id，评论的作者id，评论内容
  let { _id, authorId, comment } = req.body
  let date = new Date()
  let createTime = date.Format('yyyy-MM-dd hh:mm:ss')
  articleModel.findOne({ _id }, function(err, article) {
    if (!err) {
      article.articleCommentList = article.articleCommentList
        ? article.articleCommentList
        : []
      article.articleCommentList.unshift({ authorId, comment, createTime })
      articleModel.findOneAndUpdate({ _id }, article, function(err, data) {
        if (!err) {
          res.send({ code: 0, msg: '评论成功' })
        } else {
          throw err
        }
      })
    } else {
      throw err
    }
  })
})
// 获取前台评论作者的信息
router.post('/web/commentAuthorMsg', function(req, res) {
  // 评论的作者id
  let { authorId } = req.body
  userModel.findOne(
    { authorId },
    { author: 1, authorAvatar: 1, authorId: 1 },
    function(err, author) {
      if (!err) {
        res.send({ code: 0, author })
      }
    }
  )
})
// 通过名称查询作者fans
router.post('/web/getBlogerFans', function(req, res) {
  // 当前搜索的作者名字，里的关注列表有当前登陆博主的信息
  let id = req.body.authorId
  let author = req.body.searchContent
  if (author) {
    userModel.find(
      { author, focusList: { $elemMatch: { authorId: id } } },
      { password: 0, account: 0, _v: 0 },
      function(err, list) {
        if (!err) {
          res.send({ code: 0, data: list })
        } else {
          throw err
        }
      }
    )
  } else {
    userModel.findOne(
      { authorId: id },
      { password: 0, account: 0, _v: 0 },
      function(err, list) {
        if (!err) {
          res.send({ code: 0, data: list.fensList })
        } else {
          throw err
        }
      }
    )
  }
})
// 通过名称查询作者的关注者信息
router.post('/web/getBlogerFocus', function(req, res) {
  // 当前搜索的作者名字，里的关注列表有当前登陆博主的信息
  let id = req.body.authorId
  let author = req.body.searchContent
  // 有查询条件
  if (req.body.searchContent) {
    userModel.find(
      { author, fensList: { $elemMatch: { authorId: id } } },
      { password: 0, account: 0, _v: 0 },
      function(err, list) {
        if (!err) {
          res.send({ code: 0, data: list })
        } else {
          throw err
        }
      }
    )
    // 查询条件为空
  } else {
    userModel.findOne(
      { authorId: id },
      { password: 0, account: 0, _v: 0 },
      function(err, list) {
        if (!err) {
          res.send({ code: 0, data: list.focusList })
        } else {
          throw err
        }
      }
    )
  }
})
//更新登陆者信息
router.post('/web/updatePersonMsg', function(req, res) {
  let { detailMessage, authorId, author } = req.body

  let authorAvatar
  if (detailMessage.authorAvatar) {
    authorAvatar = detailMessage.authorAvatar
    articleModel.updateMany(
      { authorId },
      { $set: { author, authorAvatar } },
      function(err, article) {
        if (err) {
          throw err
        }
      }
    )
    userModel.findOneAndUpdate(
      { authorId },
      { $set: { author, detailMessage, authorAvatar } },
      function(err, data) {
        if (!err) {
          res.send({ code: 0, data })
        } else {
          throw err
        }
      }
    )
  } else {
    articleModel.updateMany({ authorId }, { $set: { author } }, function(
      err,
      article
    ) {
      if (err) {
        throw err
      }
    })
    userModel.findOneAndUpdate(
      { authorId },
      { $set: { author, detailMessage } },
      function(err, data) {
        if (!err) {
          res.send({ code: 0, data })
        } else {
          throw err
        }
      }
    )
  }
})
//更新用户密码
router.post('/web/changeUserPassword', function(req, res) {
  let { authorId, password, newPassword } = req.body
  userModel.findOne({ authorId, password: md5(password) }, function(err, data) {
    if (!err) {
      if (data) {
        userModel.findOneAndUpdate(
          { authorId, password: md5(password) },
          { $set: { password: md5(newPassword) } },
          function(err, tip) {
            if (!err) {
              res.send({ code: 0, msg: '修改成功', flag: true })
            } else {
              throw err
            }
          }
        )
      } else {
        res.send({ code: 0, msg: '密码不正确' })
      }
    } else {
      throw err
    }
  })
})

//更新用户密保
router.post('/web/changeSecretProtection', function(req, res) {
  let { authorId, oldAnswer, newQuestion, newAnswer } = req.body
  userModel.findOne({ authorId, answer: oldAnswer }, function(err, data) {
    if (!err) {
      if (data) {
        userModel.findOneAndUpdate(
          { authorId, answer: oldAnswer },
          { $set: { question: newQuestion, answer: newAnswer } },
          function(err, tip) {
            if (!err) {
              res.send({ code: 0, msg: '修改成功', flag: true })
            } else {
              throw err
            }
          }
        )
      } else {
        res.send({ code: 0, msg: '原密保答案不正确' })
      }
    } else {
      throw err
    }
  })
})
//通过账号查询用户密保问题
router.post('/web/findUserMsg', function(req, res) {
  let { account } = req.body
  userModel.findOne({ account }, { question: 1, authorId: 1 }, function(
    err,
    data
  ) {
    if (!err) {
      if (data) {
        res.send({ code: 0, data })
      } else {
        res.send({ code: 1, msg: '该账号不存在' })
      }
    } else {
      throw err
    }
  })
})
//通过密保问题重置用户密码
router.post('/web/restUserPassword', function(req, res) {
  let { authorId, answer, password } = req.body
  userModel.findOneAndUpdate(
    { authorId, answer },
    { $set: { answer, password: md5(password) } },
    function(err, data) {
      if (!err) {
        if (data) {
          res.send({ code: 0, msg: '重置密码成功' })
        } else {
          res.send({ code: 1, msg: '问题答案错误' })
        }
      } else {
        throw err
      }
    }
  )
})
//前端搜索文章
router.get('/web/search', function(req, res) {
  let { searchContent, page, limit } = req.query
  limit = parseInt(limit)
  articleModel.find(
    { articleTag: { $elemMatch: { $eq: searchContent } } },
    function(err, list) {
      allPage = Math.ceil(list.length / limit)
      articleModel
        .find({ state: 1, articleTag: { $elemMatch: { $eq: searchContent } } })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(function(err, resList) {
          if (!err) {
            //  根据tag能找到
            if (resList.length > 0) {
              tagModel.findOneAndUpdate(
                { tagName: searchContent },
                { $inc: { count: 1 } },
                function(err, doc) {
                  if (!err) {
                  } else {
                    throw err
                  }
                }
              )
              res.send({ code: 0, data: resList, allPage })
            } else {
              //  根据标题找到
              articleModel.find(
                {
                  articleTitle: { $regex: searchContent, $options: '$i' },
                  state: 1
                },
                function(err, tempList) {
                  allPage = Math.ceil(tempList.length / limit)
                  articleModel
                    .find({
                      articleTitle: { $regex: searchContent, $options: '$i' },
                      state: 1
                    })
                    .skip((page - 1) * limit)
                    .limit(10)
                    .exec(function(err, data) {
                      if (!err) {
                        res.send({ code: 0, data, allPage })
                      } else {
                        throw err
                      }
                    })
                }
              )
            }
          } else {
            throw err
          }
        })
    }
  )
})

router.post('/ht/upload', function(req, res) {
  // parse a file upload
  let form = new formidable.IncomingForm()
  form.uploadDir = './upload'
  form.parse(req, (err, fields, files) => {
    // res.writeHead(200, { 'content-type': 'text/plain;charset=UTF-8' })
    // res.write('received upload:\n\n')
    let name = uuid()
    let extName = path.extname(files.upload.name) //文件后缀名字
    let oldPath = 'F:/毕业设计/ht' + '/' + files.upload.path // 旧路径
    let newPath = 'F:/毕业设计/ht' + '/upload/htImages/' + name + extName // 新路径
    let mypath = 'htImages/' + name + extName
    fs.rename(oldPath, newPath, err => {
      // 重命名路径
      if (!err) {
        // res.write('写入成功')
        //res.send(util.inspect({ fields: fields, files: files }))
        res.send({
          code: 0,
          data: {
            msg: '上传成功',
            documentUrl: mypath,
            name: files.upload.name
          }
        })
      } else {
        throw err
      }
    })
  })
})

//格式化时间函数
Date.prototype.Format = function(fmt) {
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds() //毫秒
  }
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + '').substr(4 - RegExp.$1.length)
    )
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
  return fmt
}
// 数组乱序
function randomArr(arr) {
  arr.sort(function() {
    return 0.5 - Math.random()
  })
  return arr
}

module.exports = router
