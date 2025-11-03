import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { GroupNameComponent } from './group-name.component';

describe('GroupNameComponent', () => {
  let component: GroupNameComponent;
  let fixture: ComponentFixture<GroupNameComponent>;
  CommonTestingModule.setUpTestBed(GroupNameComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
