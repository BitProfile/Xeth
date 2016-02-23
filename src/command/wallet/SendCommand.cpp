#include "SendCommand.hpp"

namespace Xeth{


SendCommand::SendCommand(Ethereum::Connector::Provider &provider, DataBase &database) :
    _provider(provider),
    _database(database)
{}


QVariant SendCommand::operator()(const QVariantMap &request)
{
    std::string to = request["address"].toString().toStdString();
    std::string from = request["from"].toString().toStdString();
    std::string password = request["password"].toString().toStdString();
    const QVariant & gas = request["gas"];
    BigInt amount(request["amount"].toString().toStdString());
    size_t addrSize = to.size();
    if(addrSize==40||addrSize==42)
    {
        SendToAddressCommand command(_provider, _database);
        return send(command, from, to, password, amount, gas);
    }
    SendToStealthCommand command(_provider, _database);
    return send(command, from, to, password, amount, gas);

}


template<class Command>
QVariant SendCommand::send
(
    Command &command,
    const std::string &from,
    const std::string &to,
    const std::string &password,
    const BigInt &amount,
    const QVariant &gas
)
{
    if(gas.isNull())
    {
        return command(from, to, password, amount);
    }

    return command(from, to, password, amount, BigInt(gas.toString().toStdString()));
}




}
