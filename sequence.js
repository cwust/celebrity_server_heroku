const Sequence = {
    n: 0, 

    next : function() {
        return ++this.n;
    }
}

exports = module.exports = Sequence;