// this is part of admin.js. still has bugs

// bidTextType
// -----------


this.newBidTextType = function () {
  this.newBidTextType = api.initBidTextType();
  this.newBidTextType.view = {documentType: lov.documentTypes[1]};
  // set tId to max + 1
  this.newBidTextType.attributes.tId = Math.max.apply(null,this.bidTextTypes.map(function (t) {
    return t.attributes.tId;
  }))+1;
  // set order to max + 1, exclude empty entries
  this.newBidTextType.attributes.order = Math.max.apply(null,this.bidTextTypes.map(function (t) {
    return t.attributes.order?t.attributes.order:-1000;
  }))+1;
  this.isAddBidTextType = true;
};

this.setBidTextTypeChanged = function (ind) {
  this.bidTextTypes[ind].view.isChanged = true;
  this.isBidTextTypeChanged = true;
};

this.setBidTextTypeOrder = function (ind) {
  if (ind=== -1) {
    this.newBidTextType.view.orderError =
      (this.newBidTextType.attributes.order !== Number(this.newBidTextType.attributes.order)) ||
      this.newBidTextType.attributes.order < 1;
  } else {
    this.bidTextTypes[ind].view.error =
      (this.bidTextTypes[ind].attributes.order !== Number(this.bidTextTypes[ind].attributes.order)) ||
      this.bidTextTypes[ind].attributes.order < 1;
    this.setBidTextTypeChanged(ind);
  }
};

this.addBidTextType = function () {
  this.bidTextTypes.push(this.newBidTextType);
  this.setBidTextTypeChanged(this.bidTextTypes.length-1);  // mark added item as changed
  this.isAddBidTextType = false;
};

this.saveBidTextTypes = function () {
  var that = this;
  console.log('start delete');
  var del = this.bidTextTypes.filter(function (t) {
    return t.view.isDeleted;
  });
  api.deleteObjects(del)
    .then(function () {
      console.log('start update');
      that.bidTextTypes = that.bidTextTypes.filter(function (t) {
        return !t.view.isDeleted;
      });
      api.saveObjects(that.bidTextTypes)
        .then(function () {
          console.log('end update');
          this.isBidTextTypeChanged = false;
          for (var i=0;i<that.bidTextTypes.length;i++) {
            that.bidTextTypes[i].view.isChanged = false;
          }
          $rootScope.$digest();
        })
    })
};

// main bidTextType

this.bidTextTypes = bidTextTypes.map(function (t) {
  var tt = t;
  tt.view = {documentType: lov.documentTypes.filter(function (dt) {
    return dt.id === t.attributes.documentType;
  })[0]};
  return tt;
});
this.documentTypes = lov.documentTypes;
