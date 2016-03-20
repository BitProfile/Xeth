namespace Xeth{

template<class Sender, class Validator>
GenericSendCommand<Sender, Validator>::GenericSendCommand(Ethereum::Connector::Provider &provider, DataBase &database):
    _wallet(provider),
    _database(database)
{}


template<class Sender, class Validator>
QVariant GenericSendCommand<Sender, Validator>::operator()(const QVariantMap &request)
{
    std::string from = request["from"].toString().toStdString();
    std::string to = request["to"].toString().toStdString();
    std::string password = request["password"].toString().toStdString();
    BigInt amount(request["amount"].toString().toStdString());
    bool strict = request.contains("checksum") ? request["checksum"].toBool() : true;

    if(request.contains("gas") && request.contains("price"))
    {
         BigInt gas(request["gas"].toString().toStdString());
         BigInt price(request["price"].toString().toStdString());
         return this->operator()(from, to, password, amount, gas, price);
    }

    return this->operator()(from, to, password, amount, strict);

}

template<class Sender, class Validator>
QVariant GenericSendCommand<Sender, Validator>::operator()
(
    const std::string &from,
    const std::string &to,
    const std::string &password,
    const BigInt &amount,
    bool strict
)
{

    if(!validateDestination(to, strict))
    {
        throw std::runtime_error("invalid address");
    }

    if(!unlockSender(from, password, amount))
    {
        throw std::runtime_error("invalid password");
    }

    return QVariant::fromValue(QString(send(from, to, amount).c_str()));
}


template<class Sender, class Validator>
QVariant GenericSendCommand<Sender, Validator>::operator()
(
    const std::string &from,
    const std::string &to,
    const std::string &password,
    const BigInt &amount,
    const BigInt &gas,
    const BigInt &price,
    bool strict
)
{
    if(!validateDestination(to, strict))
    {
        throw std::runtime_error("invalid address");
    }

    if(!unlockSender(from, password, amount))
    {
        throw std::runtime_error("invalid password");
    }
    return QVariant::fromValue(QString(send(from, to, amount, gas, price).c_str()));
}


template<class Sender, class Validator>
bool GenericSendCommand<Sender, Validator>::validateDestination(const std::string &to, bool strict)
{
    Validator validator;
    return validator(to, strict);
}


template<class Sender, class Validator>
bool GenericSendCommand<Sender, Validator>::unlockSender(const std::string &from, const std::string &password, const BigInt &amount)
{
    if(amount<=0 || _wallet.getBalance(from) < amount)
    {
        return false;
    }
    if(!_wallet.unlockAccount(from, password, 5))
    {
        //maybe it was a stealth payment
        StealthPaymentStore &payments = _database.getStealthPayments();
        StealthPaymentStore::Iterator it = payments.find(from.c_str());
        if(it==payments.end())
        {
            return false;
        }
        //address found, lets import key
        //finding stealth address
        StealthRedeemKeyFactory factory(_database);
        EthereumKey key = factory.create(*it, password);
        _database.getEthereumKeys().insert(key);
        if(!_wallet.unlockAccount(from, password, 5))
        {
            return false;
        }
    }
    return true;
}

template<class Sender, class Validator>
std::string GenericSendCommand<Sender, Validator>::send(const std::string &from, const std::string &to, const BigInt &amount)
{
    Sender sender;
    return sender(_wallet, _database, from, to, amount);
}


template<class Sender, class Validator>
std::string GenericSendCommand<Sender, Validator>::send(const std::string &from, const std::string &to, const BigInt &amount, const BigInt &gas, const BigInt &price)
{
    Sender sender;
    return sender(_wallet, _database, from, to, amount, gas, price);
}


}
