let myCard = [];

function addMyCard($item){

    // dynamically find out the qty
    let $qty = $('#'+$item).children("option:selected").val();

    // search the cart and see if we already added
    // the item. If we did, remove the old qty.
    myCard.forEach(function(itemCurrent) {
        if(itemCurrent.includes($item)){
            myCard.splice(myCard.indexOf($item), 1)
        }
    });

    // add the item to the cart if quantity specified
    if($qty !== ''){
        myCard.push($item + '-' + $qty);
    }

    if(myCard.length !== 0){
        alert(myCard);
        $('#checkout').prop('disabled', false);
    } else {
        $('#checkout').prop('disabled', true);
    }
}

function updateDB(id)
{
    let $quantity = $("#" + id).val();
    $.post("/updateDB", {id: id, qty: $quantity}).done(function (data){
        alert("Data loaded: " + data);
    })

}

$(window).on('load', function (){

    $("#loginStart").on('click', function () {
        let $username = $("#username").val();
        let $password = $("#password").val();
        $password = CryptoJS.SHA256($password).toString();

        if($username !== "" && $password !== ""){
            $.post("/login", {username: $username, password: $password}).done(function (data) {
                if(data.includes("customer"))
                {
                    window.location = "/#customer";
                } else if(data.includes("manager"))
                {
                    window.location = "/#manager";
                    $.get('/getManagerStats', function (data)
                    {
                        $('#managerTable tbody').html(data.table);
                        $('#managerOutput').html(data.total);
                    })
                } else if (data.includes("cook"))
                {
                    $.get("/getCookData", function (data)
                    {
                        $('#productOutput').html(data);
                    });
                    window.location = "/#cook";
                } else if (data.includes("driver"))
                {
                    window.location = '/#driver';
                }
            });
        }
    })

    $("#addToCartNy").on('click', function (){
        addMyCard("ny_pizza_qty");
    });

    $("#addToCartBBQ").on('click', function (){
        addMyCard("bbq_pizza_qty");
    });

    $("#addToCartHamburger").on('click', function (){
        addMyCard("hamburger_qty");
    });

    $("#addToCartTaco").on('click', function (){
        addMyCard("taco_qty");
    });

    $("#addToCartKebab").on('click', function (){
        addMyCard("kebab_qty");
    });

    $("#checkout").on("click", function(){

        if(myCard.length === 0) return;

        let buffer = '';
        let items = myCard.toString().split(',');
        let totalPrice = 0;
        items.forEach(item => {
            let product = item.split('-');
            let productName = product[0].replace('_qty', '');
            let productQuantity = product[1];
            let price = 0;


            $.ajax({
                async: false,
                type: 'GET',
                url: '/getAmount',
                data: {productName: productName},
                success: function (data){
                    price = data.price;
                    totalPrice += price * productQuantity;
                    buffer += '<tr><td>' + productName + '</td><td>' + productQuantity + '</td><td>' + productQuantity * price + '</td></tr>';
                    // buffer += '<b>Product name: </b><quantity>' + productName + '</quantity><b> Product quantity: </b><quantity>' + productQuantity + "</quantity><b>Amount: </b><quantity>" + price * productQuantity + "</quantity><br>";
                }
            })
        });

        $('#orderReviewTable tbody').html(buffer);
        buffer = '<b>For a total of ' + totalPrice + ' euros</b>';
        $("#orderOutput").html(buffer);
        window.location="/#orderReview";
    })

    $('#pay').on('click', function (){
        $.post("/pay", {order: myCard.toString()}).done(function (response)
        {
            alert(response);
        });
    });

    $('#registerStart').on('click', function(){
        window.location = '/#register';
    })

    $('#signUpButton').on('click', function(){
        let $username = $('#registerUsername');

        if($username.val() === ''){
            alert("Username must be specified!");
            return;
        }

        let $password = $('#registerPassword');
        if($password.val() === ''){
            alert("Password must be specified!")
            return;
        }

        let $confirmPassword = $('#registerConfirmPassword');
        if($confirmPassword.val() !== $password.val()){
            alert("The confirm password must be the same as the password!");
            return;
        }

        $password = CryptoJS.SHA256($password.val()).toString();

        $.post('/register', {username: $username.val(), password: $password})
            .done(function(){
                window.location = '/';
            })
            .fail(function(){
                alert("Something went wrong...");
            });

    })
});