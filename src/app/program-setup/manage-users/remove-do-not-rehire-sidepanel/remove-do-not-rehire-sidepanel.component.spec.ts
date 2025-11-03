import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RemoveDoNotRehireSidepanelComponent } from './remove-do-not-rehire-sidepanel.component';

describe('RemoveDoNotRehireSidepanelComponent', () => {
  let component: RemoveDoNotRehireSidepanelComponent;
  let fixture: ComponentFixture<RemoveDoNotRehireSidepanelComponent>;
  CommonTestingModule.setUpTestBed(RemoveDoNotRehireSidepanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoveDoNotRehireSidepanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoveDoNotRehireSidepanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
