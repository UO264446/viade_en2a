import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ButtonWrapper, Input } from "../Map/map.style";
import { Button } from "react-bootstrap";
import { Modal } from "react-bootstrap";
import {
  useNotification,
  NotificationTypes,
} from "@inrupt/solid-react-components";
import {
  storageHelper,
  permissionHelper,
  notification as helperNotification
} from "@utils";
import {
  parseGroup,
} from "./../../../services/groupManager";
import { successToaster, errorToaster,ldflexHelper } from '@utils';
import styled from 'styled-components';
export const Img = styled.img`
  box-sizing: border-box;
  width: 100%;
  height: 100%;
`;
export const ImageContainer = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-size: cover;
  overflow: hidden;
  display: inline-table;
`;

export const ShareButton = (props) => {
  const { webId, routeUrl, friends, images} = props;
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [agent, setAgent] = useState("");

  const show = () => {
    setShowModal(true);
  };

  const close = () => {
    setShowModal(false);
  };

  const { createNotification } = useNotification(webId);

  function getName(friendWebId){
    return friendWebId.toString().substring(8).split(".")[0];
  }

  function getImgByWebId(friendWebId){
    if(images!== undefined){
      for(let i=0; i<images.length; i++){
        if(images[i].id === friendWebId){
          return images[i].img;
        }
      }
    }
  }

  async function shareWith() {
    if (agent.endsWith("me")) {
      if (agent !== undefined && agent.length !== 0) {
        const isRegistered =await checkViadeRegistered(agent);
        if(isRegistered===true){
          permissionHelper.setReadPermissions(routeUrl, webId, agent);
          var r = routeUrl.split("/");
          //Notification
          const content = {
            title: t("mapView.notificationTitle"),
            summary:
              webId.substring(8, webId.length - 16) +
              t("mapView.notificationSummary") +
              r[r.length - 1],
            actor: webId,
          };
          let appPath = "";
          appPath = await storageHelper.getAppStorage(agent);
          const viadeSettings = `${appPath}settings.ttl`;

          const inboxes = await helperNotification.findUserInboxes([
            { path: agent, name: "Global" },
            { path: viadeSettings, name: "Viade" },
          ]);
          const to = helperNotification.getDefaultInbox(
            inboxes,
            "Viade",
            "Global"
          );
          const license = "https://creativecommons.org/licenses/by-sa/4.0/";
          createNotification(
            content,
            to.path,
            NotificationTypes.ANNOUNCE,
            license
          );
          close();
          successToaster(t("mapView.shareSuccess"));
        }else{
          close();
          errorToaster(t("mapView.errorSuccess")+ agent);
        }
      } 
    } else {
      parseGroup(agent).then(function(result) {
        result.forEach((url) => {
          setAgent(url);
          shareWith();
        });
      });
    }
  }

  async function checkViadeRegistered(agentWebId){
    let appPath = "";
    let a =await ldflexHelper.resourceExists(agentWebId);
    if(a=== true){
      appPath = await storageHelper.getAppStorage(agent);
      const inboxPath = `${appPath}inbox`;
      const inboxExists = await ldflexHelper.resourceExists(inboxPath);
      return inboxExists;
    } else{
      return a;
    }
  }

  function handleInputFriend(event, friend) {
    event.preventDefault();
    setAgent(friend);
  }

  function handleInputChange(event) {
    event.preventDefault();
    setAgent(event.target.value);
  }

  return (
    <div>
      <ButtonWrapper>
        <Button
          variant="success"
          onClick={show}
          data-testid={"buttonShare"}
          key={"buttonShare"}
        >
          {t("mapView.shareButton")}
        </Button>
      </ButtonWrapper>
      <Modal
        show={showModal}
        onHide={close}
        centered
        data-testid={"modalShare"}
        key={"modalShare"}
      >
        <Modal.Header
          closeButton
          key={"closeShare"}
          data-testid={"closeShare"}
        ></Modal.Header>
        <Modal.Body>
          {t("mapView.shareWith")}
          <Input
            type="text"
            size="200"
            value={agent}
            onChange={handleInputChange}
            data-testid={"inputShare"}
            key={"inputShare"}
          />
          { friends.map(friend => (
            <div>
            <Button className="buttonFriend" variant="light"  onClick={(event) => handleInputFriend(event,friend)} style={{'paddingLeft': '1px'}} data-testid={"buttonFriend"+friend}  key={"buttonFriend"+friend}>
              <ImageContainer data-testid={"ImageContainer"+friend}  key={"ImageContainer"+friend}>
                <Img src={getImgByWebId(friend)} alt="profile" data-testid={"img"+friend}  key={"img"+friend}/>
              </ImageContainer>{getName(friend)}
            </Button>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={shareWith}
            data-testid={"shareWith"}
            key={"shareWith"}
          >
            {t("mapView.share")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
